import { ApiResponse } from '@youziyi/types';
import { config } from '../config';

const QUEUE_KEY = 'OFFLINE_REQUEST_QUEUE';
let isOnline = true;

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

function saveToOfflineQueue(options: WechatMiniprogram.RequestOption) {
  const queue = wx.getStorageSync(QUEUE_KEY) || [];
  queue.push(options);
  wx.setStorageSync(QUEUE_KEY, queue);
  console.log('已将请求加入离线队列', options.url);
}

function flushOfflineQueue() {
  const queue = wx.getStorageSync(QUEUE_KEY) || [];
  if (queue.length > 0) {
    wx.removeStorageSync(QUEUE_KEY);
    console.log(`开始重发 ${queue.length} 个离线请求`);
    queue.forEach((options: WechatMiniprogram.RequestOption) => {
      // 重新发起请求
      request(options).catch(err => {
        console.error('离线请求重发失败', err);
      });
    });
  }
}

export function request<T = any>(
  options: WechatMiniprogram.RequestOption
): Promise<ApiResponse<T>> {
  return new Promise((resolve, reject) => {
    if (!isOnline) {
      wx.showToast({
        title: '当前无网络，请求已缓存',
        icon: 'none',
      });
      // 将非 GET 请求加入离线队列
      if (options.method && options.method.toUpperCase() !== 'GET') {
        saveToOfflineQueue(options);
      }
      return reject(new Error('offline'));
    }

    wx.request({
      ...options,
      url: options.url.startsWith('http') ? options.url : `${config.baseURL}${options.url}`,
      success: (res) => {
        const statusCode = res.statusCode;
        if (statusCode >= 200 && statusCode < 300) {
          const data = res.data as ApiResponse<T>;
          // 后端规范 code === 0 表示成功
          if (data.code === 0) {
            resolve(data);
          } else {
            wx.showToast({
              title: data.message || '请求失败',
              icon: 'none',
            });
            reject(data);
          }
        } else {
          wx.showToast({
            title: `服务器错误 ${statusCode}`,
            icon: 'error',
          });
          reject(res);
        }
      },
      fail: (err) => {
        // 请求失败也可能是网络断开，尝试缓存
        if (options.method && options.method.toUpperCase() !== 'GET') {
           saveToOfflineQueue(options);
        }
        wx.showToast({
          title: '网络连接失败',
          icon: 'error',
        });
        reject(err);
      },
    });
  });
}
