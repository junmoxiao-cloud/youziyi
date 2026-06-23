import { FamilyInfo, FamilyProfileMember, resolveCityLabel } from '../../utils/youziyi-types';
import { request } from '../../utils/request';

type Mode = 'create' | 'join';

interface DisplayFamilyMember extends FamilyProfileMember {
  roleText: string;
  cityText: string;
}

interface FamilyJoinData {
  mode: Mode;
  inviteCode: string;
  createdCode: string;
  isLoading: boolean;
  errorMessage: string;
  successMessage: string;
  profile: UserProfileMiniapp | null;
  familyInfo: FamilyInfo | null;
  members: DisplayFamilyMember[];
  hasFamily: boolean;
}

function formatRole(role: string): string {
  return role === 'elder' ? '长辈' : '子女';
}

function formatCity(member: FamilyProfileMember): string {
  return resolveCityLabel(member.city, member.cityCode) || '待完善';
}

Page<FamilyJoinData, WechatMiniprogram.IAnyObject>({
  data: {
    mode: 'create',
    inviteCode: '',
    createdCode: '',
    isLoading: false,
    errorMessage: '',
    successMessage: '',
    profile: null,
    familyInfo: null,
    members: [],
    hasFamily: false,
  },

  onLoad() {
    this.loadProfile();
  },

  async loadProfile() {
    const app = getApp<IAppOption>();
    const userId = app.globalData.userId;

    if (!userId) {
      wx.showToast({ title: '登录状态已失效', icon: 'none' });
      return;
    }

    this.setData({ isLoading: true });
    wx.showLoading({ title: '加载中...', mask: true });

    try {
      const profileRes = await request<UserProfileMiniapp>({
        url: `/api/user/profile/${userId}`,
        method: 'GET',
      });

      const profile = profileRes.data;
      const rawFamilyInfo = profile.familyInfo as FamilyInfo | null | undefined;
      const familyInfo =
        rawFamilyInfo !== null && rawFamilyInfo !== undefined ? rawFamilyInfo : null;
      const members = familyInfo
        ? familyInfo.members.map((member) => ({
            ...member,
            roleText: formatRole(member.role),
            cityText: formatCity(member),
          }))
        : [];
      const hasFamily = Boolean(
        profile.familyId && familyInfo && Array.isArray(familyInfo.members) && familyInfo.members.length > 0
      );

      app.setUserProfile(profile);
      this.setData({
        profile,
        familyInfo,
        members,
        hasFamily,
        errorMessage: '',
      });
    } catch (error) {
      console.error('加载家庭信息失败', error);
      wx.showToast({ title: '加载失败，请下拉重试', icon: 'none' });
    } finally {
      wx.hideLoading();
      this.setData({ isLoading: false });
    }
  },

  onModeTap(e: WechatMiniprogram.TouchEvent) {
    const mode = e.currentTarget.dataset.mode as Mode;
    this.setData({ mode, errorMessage: '' });
  },

  onInviteCodeInput(e: WechatMiniprogram.Input) {
    this.setData({
      inviteCode:
        e.detail.value !== null && e.detail.value !== undefined ? e.detail.value : '',
      errorMessage: '',
    });
  },

  async onCreate() {
    const app = getApp<IAppOption>();
    const userId = app.globalData.userId;

    if (!userId) {
      wx.showToast({ title: '登录状态已失效', icon: 'none' });
      return;
    }

    this.setData({ isLoading: true, errorMessage: '' });
    wx.showLoading({ title: '创建中...', mask: true });

    try {
      const res = await request<{ inviteCode: string }>({
        url: '/api/family/create',
        method: 'POST',
        data: { userId },
      });

      this.setData({
        createdCode: res.data.inviteCode,
        successMessage: '家庭已创建成功，牵挂码已生成。',
      });

      wx.hideLoading();
      await this.loadProfile();
    } catch (error) {
      wx.hideLoading();
      console.error('创建家庭失败', error);
      this.setData({ errorMessage: '创建家庭失败，请稍后重试' });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  async onJoin() {
    const app = getApp<IAppOption>();
    const userId = app.globalData.userId;
    const inviteCode = this.data.inviteCode.trim();

    if (!userId) {
      wx.showToast({ title: '登录状态已失效', icon: 'none' });
      return;
    }

    if (!inviteCode) {
      this.setData({ errorMessage: '请输入牵挂码' });
      return;
    }

    this.setData({ isLoading: true, errorMessage: '' });
    wx.showLoading({ title: '连接中...', mask: true });

    try {
      await request<{ familyId: string; name: string }>({
        url: '/api/family/join',
        method: 'POST',
        data: { userId, inviteCode },
      });

      this.setData({
        successMessage: '连接成功！家庭资料已同步。',
      });

      wx.hideLoading();
      await this.loadProfile();
    } catch (error) {
      wx.hideLoading();
      console.error('加入家庭失败', error);
      this.setData({ errorMessage: '加入家庭失败，请检查牵挂码后重试' });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  onEnterHome() {
    wx.reLaunch({ url: '/pages/role-select/role-select' });
  },
});
