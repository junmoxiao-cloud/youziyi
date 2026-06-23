const getEnvBaseURL = () => {
  try {
    const { miniProgram } = wx.getAccountInfoSync();
    // envVersion: 'develop' | 'trial' | 'release'
    if (miniProgram.envVersion === 'develop') {
      // 微信小程序开发者工具运行在独立环境中，localhost 常无法指向宿主机，
      // 使用局域网 IP 可确保真机/模拟器均能访问本地后端服务。
      return 'http://192.168.31.228:3001';
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
