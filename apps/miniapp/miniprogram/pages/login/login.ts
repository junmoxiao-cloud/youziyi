import { request } from '../../utils/request';

interface LoginData {
  name: string;
  password: string;
}

interface LoginResult {
  userId: string;
  name: string;
  cityCode: string | null;
  role: UserRole;
}

Page<LoginData, WechatMiniprogram.IAnyObject>({
  data: {
    name: '',
    password: '',
  },

  onNameInput(e: WechatMiniprogram.Input) {
    this.setData({ name: e.detail.value });
  },

  onPasswordInput(e: WechatMiniprogram.Input) {
    this.setData({ password: e.detail.value });
  },

  navigateToRegister() {
    wx.navigateTo({
      url: '/pages/register/register',
    });
  },

  async handleLogin() {
    const name = this.data.name.trim();
    const password = this.data.password.trim();

    if (!name || !password) {
      wx.showToast({
        title: '请输入称呼和密码',
        icon: 'none',
      });
      return;
    }

    wx.showLoading({ title: '登录中...', mask: true });

    try {
      const loginRes = await request<LoginResult>({
        url: '/api/auth/login',
        method: 'POST',
        data: { name, password },
      });

      const { userId, role, name: userName } = loginRes.data;
      const app = getApp<IAppOption>();
      app.setAuth(true, userId, role, userName);

      const profileRes = await request<UserProfileMiniapp>({
        url: `/api/user/profile/${userId}`,
        method: 'GET',
      });

      app.setUserProfile(profileRes.data);
      wx.hideLoading();
      app.navigateToLanding();
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none',
      });
      console.error('登录失败', error);
    }
  },
});
