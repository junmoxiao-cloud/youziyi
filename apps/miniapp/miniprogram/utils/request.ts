import { ApiResponse } from './youziyi-types';
import { config } from '../config';

const QUEUE_KEY = 'OFFLINE_REQUEST_QUEUE';
let isOnline = true;

/** 离线队列中只保存可序列化的核心请求字段，便于网络恢复后重放 */
type QueuedRequest = Pick<
  WechatMiniprogram.RequestOption,
  'method' | 'url' | 'data' | 'header'
>;

/** request 选项扩展，支持静默模式 */
type RequestOptions = WechatMiniprogram.RequestOption & {
  /** 为 true 时不自动展示错误 toast，由页面自行处理错误 UI */
  silent?: boolean;
};

// 初始化网络状态
wx.getNetworkType({
  success: (res) => {
    isOnline = res.networkType !== 'none';
    if (isOnline) {
      flushOfflineQueue();
    }
  },
});

// 监听网络状态变化
wx.onNetworkStatusChange((res) => {
  isOnline = res.isConnected;
  if (isOnline) {
    flushOfflineQueue();
  }
});

function saveToOfflineQueue(options: RequestOptions) {
  const queue: QueuedRequest[] = wx.getStorageSync(QUEUE_KEY) || [];
  const queuedRequest: QueuedRequest = {
    method: options.method,
    url: options.url,
    data: options.data,
    header: options.header,
  };
  queue.push(queuedRequest);
  wx.setStorageSync(QUEUE_KEY, queue);
  console.log('已将请求加入离线队列', options.url);
}

/** 清空待重发的离线请求队列 */
export function clearOfflineQueue() {
  wx.removeStorageSync(QUEUE_KEY);
  console.log('已清空离线请求队列');
}

function flushOfflineQueue() {
  const queue: QueuedRequest[] = wx.getStorageSync(QUEUE_KEY) || [];
  if (queue.length > 0) {
    wx.removeStorageSync(QUEUE_KEY);
    console.log(`开始重发 ${queue.length} 个离线请求`);
    queue.forEach((item: QueuedRequest) => {
      request(item).catch((err) => {
        console.error('离线请求重发失败', err);
      });
    });
  }
}

export function request<T = any>(
  options: RequestOptions
): Promise<ApiResponse<T>> {
  return new Promise((resolve, reject) => {
    const { silent, ...requestOption } = options;

    if (!isOnline) {
      if (!silent) {
        wx.showToast({
          title: '当前无网络，请求已缓存',
          icon: 'none',
        });
      }
      // 将非 GET 请求加入离线队列。
      // 当前离线队列已覆盖所有非 GET 端点，包括：
      // /api/auth/login、/api/auth/register、/api/user/profile/update、
      // /api/health/checkin、/api/family/create、/api/family/join。
      // 注意：/api/voice/upload 使用 wx.uploadFile 单独上传，不走本 request，
      // 因此其离线缓存机制不适用，需要由业务方单独处理。
      if (options.method && options.method.toUpperCase() !== 'GET') {
        saveToOfflineQueue(options);
      }
      return reject(new Error('offline'));
    }

    wx.request({
      ...requestOption,
      url: options.url.startsWith('http') ? options.url : `${config.baseURL}${options.url}`,
      success: (res) => {
        const statusCode = res.statusCode;
        if (statusCode >= 200 && statusCode < 300) {
          const data = res.data as ApiResponse<T>;
          // 后端规范 code === 0 表示成功
          if (data.code === 0) {
            resolve(data);
          } else {
            if (!silent) {
              wx.showToast({
                title: data.message || '请求失败',
                icon: 'none',
              });
            }
            reject(data);
          }
        } else {
          if (!silent) {
            wx.showToast({
              title: `服务器错误 ${statusCode}`,
              icon: 'error',
            });
          }
          reject(res);
        }
      },
      fail: (err) => {
        // 请求失败也可能是网络断开，尝试缓存。
        if (options.method && options.method.toUpperCase() !== 'GET') {
          saveToOfflineQueue(options);
        }
        if (!silent) {
          wx.showToast({
            title: '网络连接失败',
            icon: 'error',
          });
        }
        reject(err);
      },
    });
  });
}
