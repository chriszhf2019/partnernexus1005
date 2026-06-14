// ─── PartnerNexus 渠道会小程序 ──────────────────────
App({
  globalData: {
    userInfo: null,
    openId: null,
    companyId: null,
    companyName: '',
    token: null,
    apiBase: 'https://partner.velolabs.top/api',
    scoreRules: {
      register: 20,
      checkin: 30,
      question: 15,
      share: 10,
      referral: 40
    }
  },

  onLaunch() {
    this.checkSession();
  },

  // 检查登录态
  checkSession() {
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.token = token;
      this.fetchUserInfo();
    }
  },

  // 微信登录
  wxLogin() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            wx.request({
              url: `${this.globalData.apiBase}/auth/wechat-login`,
              method: 'POST',
              data: { code: res.code },
              success: (resp) => {
                if (resp.data.token) {
                  wx.setStorageSync('token', resp.data.token);
                  this.globalData.token = resp.data.token;
                  this.globalData.openId = resp.data.openId;
                  this.globalData.userInfo = resp.data.user;
                  this.globalData.companyId = resp.data.companyId;
                  this.globalData.companyName = resp.data.companyName;
                  resolve(resp.data);
                }
              },
              fail: reject
            });
          }
        },
        fail: reject
      });
    });
  },

  // 获取用户信息
  fetchUserInfo() {
    wx.request({
      url: `${this.globalData.apiBase}/user/profile`,
      header: { Authorization: `Bearer ${this.globalData.token}` },
      success: (res) => {
        if (res.data) {
          this.globalData.userInfo = res.data;
          this.globalData.companyId = res.data.companyId;
          this.globalData.companyName = res.data.companyName;
        }
      }
    });
  },

  // 通用请求方法
  request(url, method = 'GET', data = {}) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.globalData.apiBase}${url}`,
        method,
        data,
        header: {
          'Authorization': `Bearer ${this.globalData.token}`,
          'Content-Type': 'application/json'
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else if (res.statusCode === 401) {
            this.wxLogin().then(() => resolve(this.request(url, method, data)));
          } else {
            reject(res.data);
          }
        },
        fail: reject
      });
    });
  }
});
