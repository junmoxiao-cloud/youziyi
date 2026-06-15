"use strict";
// apps/miniapp/miniprogram/utils/request.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.request = request;
// 假设本地或开发环境后端地址
const BASE_URL = 'http://localhost:3000';
function request(options) {
    return new Promise((resolve, reject) => {
        wx.request({
            ...options,
            url: options.url.startsWith('http') ? options.url : `${BASE_URL}${options.url}`,
            success: (res) => {
                const statusCode = res.statusCode;
                if (statusCode >= 200 && statusCode < 300) {
                    const data = res.data;
                    // 后端规范 code === 0 表示成功
                    if (data.code === 0) {
                        resolve(data);
                    }
                    else {
                        wx.showToast({
                            title: data.message || '请求失败',
                            icon: 'none',
                        });
                        reject(data);
                    }
                }
                else {
                    wx.showToast({
                        title: `服务器错误 ${statusCode}`,
                        icon: 'error',
                    });
                    reject(res);
                }
            },
            fail: (err) => {
                wx.showToast({
                    title: '网络连接失败',
                    icon: 'error',
                });
                reject(err);
            },
        });
    });
}
