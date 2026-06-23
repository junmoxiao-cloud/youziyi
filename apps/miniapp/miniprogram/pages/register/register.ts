import { request } from '../../utils/request';

interface RegisterData {
  name: string;
  password: string;
  role: UserRole;
}

interface RegisterResult {
  userId: string;
  name: string;
  role: UserRole;
}

Page<RegisterData, WechatMiniprogram.IAnyObject>({
  data: {
    name: '',
    password: '',
    role: 'elder',
  },

  onNameInput(e: WechatMiniprogram.Input) {
    this.setData({ name: e.detail.value });
  },

  onPasswordInput(e: WechatMiniprogram.Input) {
    this.setData({ password: e.detail.value });
  },

  selectRole(e: WechatMiniprogram.TouchEvent) {
    const role = e.currentTarget.dataset.role as UserRole;
    this.setData({ role });
  },

  navigateToLogin() {
    wx.navigateTo({
      url: '/pages/login/login',
    });
  },

  async handleRegister() {
    const name = this.data.name.trim();
    const password = this.data.password.trim();
    const { role } = this.data;

    if (!name || !password) {
      wx.showToast({
        title: '请填写称呼和密码',
        icon: 'none',
      });
      return;
    }

    wx.showLoading({ title: '建立连接中...', mask: true });

    try {
      await request<RegisterResult>({
        url: '/api/auth/register',
        method: 'POST',
        data: { name, password, role },
      });

      wx.hideLoading();
      wx.showToast({
        title: '连接已建立，欢迎您的加入',
        icon: 'success',
      });

      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/login/login',
        });
      }, 1500);
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '注册失败，请重试',
        icon: 'none',
      });
      console.error('注册失败', error);
    }
  },
});
