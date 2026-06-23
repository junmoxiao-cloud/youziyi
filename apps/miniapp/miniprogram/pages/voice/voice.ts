import { config } from '../../config';

// 获取全局唯一的录音管理器
const recorderManager = wx.getRecorderManager();

Page({
  data: {
    isRecording: false,
    userId: '',
    storyId: 'default-story',
  },

  onLoad() {
    const app = getApp<IAppOption>();
    const userId =
      app.globalData.userId !== null && app.globalData.userId !== undefined
        ? app.globalData.userId
        : '';
    const storyId =
      app.globalData.userProfile &&
      app.globalData.userProfile.familyId !== null &&
      app.globalData.userProfile.familyId !== undefined
        ? app.globalData.userProfile.familyId
        : 'default-story';

    this.setData({ userId, storyId });

    recorderManager.onStart(() => {
      console.log('recorder start');
    });

    recorderManager.onStop((res) => {
      console.log('recorder stop', res);
      const { tempFilePath } = res;
      this.uploadVoice(tempFilePath);
    });
  },

  startRecord() {
    if (!this.data.userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    this.setData({ isRecording: true });
    wx.vibrateShort({ type: 'medium' });

    const options: WechatMiniprogram.RecorderManagerStartOption = {
      duration: 60000,
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000,
      format: 'aac',
    };
    recorderManager.start(options);
  },

  stopRecord() {
    if (this.data.isRecording) {
      this.setData({ isRecording: false });
      recorderManager.stop();
      wx.vibrateShort({ type: 'medium' });
    }
  },

  uploadVoice(filePath: string) {
    wx.showLoading({ title: '发送中...' });

    wx.uploadFile({
      url: `${config.baseURL}/api/voice/upload`,
      filePath,
      name: 'file',
      formData: {
        userId: this.data.userId,
        storyId: this.data.storyId,
      },
      success: (res) => {
        wx.hideLoading();
        try {
          const data = JSON.parse(res.data);
          if (data.code === 0) {
            wx.showToast({ title: '发送成功', icon: 'success' });
            wx.vibrateShort({ type: 'heavy' });
            // 返回上一页，由 companion 等列表页在 onShow 中自动刷新语音列表
            setTimeout(() => {
              wx.navigateBack({ delta: 1, fail: () => {} });
            }, 800);
          } else {
            wx.showToast({ title: data.message || '发送失败', icon: 'none' });
          }
        } catch (e) {
          wx.showToast({ title: '服务器错误', icon: 'error' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误', icon: 'error' });
        console.error(err);
      },
    });
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  },
});
