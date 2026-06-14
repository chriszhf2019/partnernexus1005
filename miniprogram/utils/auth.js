// ─── 微信授权工具 ──────────────────────────────────
const app = getApp();

// 检查并请求用户信息授权
function getUserProfile() {
  return new Promise((resolve, reject) => {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        app.globalData.userInfo = res.userInfo;
        resolve(res.userInfo);
      },
      fail: reject
    });
  });
}

// 检查并请求手机号授权
function getPhoneNumber(e) {
  return new Promise((resolve, reject) => {
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      // 将加密数据发送到后端解密
      wx.request({
        url: `${app.globalData.apiBase}/auth/decrypt-phone`,
        method: 'POST',
        data: {
          encryptedData: e.detail.encryptedData,
          iv: e.detail.iv
        },
        header: { Authorization: `Bearer ${app.globalData.token}` },
        success: (res) => resolve(res.data.phoneNumber),
        fail: reject
      });
    } else {
      reject(new Error('用户拒绝授权手机号'));
    }
  });
}

// 订阅消息（会议提醒）
// ⚠️ 请将 TEMPLATE_ID_REMINDER 和 TEMPLATE_ID_CHECKIN
//    替换为微信公众平台中申请的实际模板 ID。
//    可在 微信公众平台 → 功能 → 订阅消息 中获取。
function subscribeReminder() {
  return new Promise((resolve, reject) => {
    wx.requestSubscribeMessage({
      tmplIds: ['TEMPLATE_ID_REMINDER', 'TEMPLATE_ID_CHECKIN'],
      success: resolve,
      fail: reject
    });
  });
}

// 获取用户当前位置
function getLocation() {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: 'wgs84',
      success: (res) => resolve({
        latitude: res.latitude,
        longitude: res.longitude
      }),
      fail: reject
    });
  });
}

// 保存用户信息到本地
function saveUserInfo(userInfo) {
  wx.setStorageSync('userInfo', userInfo);
  app.globalData.userInfo = userInfo;
}

// 获取本地用户信息
function getLocalUserInfo() {
  return wx.getStorageSync('userInfo') || app.globalData.userInfo;
}

module.exports = {
  getUserProfile,
  getPhoneNumber,
  subscribeReminder,
  getLocation,
  saveUserInfo,
  getLocalUserInfo
};
