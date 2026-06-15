import { config } from '../../config';

// 获取全局唯一的录音管理器
const recorderManager = wx.getRecorderManager();

Page({
  data: {
    isRecording: false
  },

  onLoad() {
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
    this.setData({ isRecording: true });
    wx.vibrateShort({ type: 'medium' });
    
    const options: WechatMiniprogram.RecorderManagerStartOption = {
      duration: 60000,
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000,
      format: 'aac'
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
      url: `${config.baseURL}/api/voice/upload`, // 预留的上传接口
      filePath: filePath,
      name: 'file',
      formData: {
        userId: 'mock-user-123',
        storyId: 'story-456'
      },
      success: (res) => {
        wx.hideLoading();
        try {
          const data = JSON.parse(res.data);
          if (data.code === 0) {
            wx.showToast({ title: '发送成功', icon: 'success' });
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
      }
    });
  }
});
