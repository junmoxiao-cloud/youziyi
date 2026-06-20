const getEnvBaseURL = () => {
  try {
    const { miniProgram } = wx.getAccountInfoSync();
    // envVersion: 'develop' | 'trial' | 'release'
    if (miniProgram.envVersion === 'develop') {
      return 'http://localhost:3001';
    }
    return 'https://api.youziyi.com';
  } catch (error) {
    console.error('获取小程序环境信息失败', error);
    return 'https://api.youziyi.com';
  }
};

export const config = {
  baseURL: getEnvBaseURL(),
};
