"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request_1 = require("../../utils/request");
Page({
    data: {
        mood: '',
        steps: ''
    },
    onLoad() {
        // 页面加载时的逻辑
    },
    checkIn(e) {
        const mood = e.currentTarget.dataset.mood;
        this.setData({
            mood
        });
        wx.showToast({
            title: `已选择: ${mood === 'happy' ? '开心' : mood === 'calm' ? '平静' : '低落'}`,
            icon: 'none'
        });
        // 添加多模态反馈：震动
        wx.vibrateShort({ type: 'medium' });
    },
    onStepInput(e) {
        this.setData({
            steps: e.detail.value
        });
    },
    async submitCheckIn() {
        const { mood, steps } = this.data;
        if (!mood) {
            wx.showToast({ title: '请选择心情', icon: 'none' });
            return;
        }
        if (!steps) {
            wx.showToast({ title: '请输入步数', icon: 'none' });
            return;
        }
        wx.showLoading({ title: '提交中...' });
        try {
            // 调用封装的请求工具发送打卡数据
            await (0, request_1.request)({
                url: '/api/health/checkin',
                method: 'POST',
                data: {
                    userId: 'mock-user-123',
                    mood: mood,
                    steps: parseInt(steps, 10),
                    timestamp: Date.now()
                }
            });
            wx.hideLoading();
            wx.showToast({
                title: '打卡成功',
                icon: 'success'
            });
            wx.vibrateShort({ type: 'heavy' });
        }
        catch (error) {
            wx.hideLoading();
            // request 内部已经处理了错误提示，这里可以选择不额外处理
            console.error('打卡失败', error);
        }
    },
    navigateToVoice() {
        wx.navigateTo({
            url: '/pages/voice/voice'
        });
    }
});
