Page({
  selectElder() {
    const app = getApp<IAppOption>();
    app.setViewMode('care');
    wx.reLaunch({ url: '/pages/index/index' });
  },

  selectChild() {
    const app = getApp<IAppOption>();
    app.setViewMode('companion');
    wx.reLaunch({ url: '/pages/companion/companion' });
  },
});
