# PartnerNexus 部署完成指南

## ✅ 已完成

- [x] Web 前端部署 → https://partner.velolabs.top
- [x] 代码提交 (133 files, v2.0)
- [x] Supabase 数据库 Schema (12 张表, RLS 策略)
- [x] 微信小程序代码 (37 个文件, 6 个页面)
- [x] Vercel 项目已关联

## 🔧 你需要做的 3 个浏览器操作 (共 10 分钟)

### 步骤 1: 创建 Supabase 项目

1. 打开 https://supabase.com → Sign in with GitHub
2. 点击 "New project"
3. 填写:
   - Name: `partnernxus`
   - Database Password: (生成一个强密码)
   - Region: Southeast Asia (Singapore) 或 Northeast Asia (Tokyo)
4. 等待创建完成 (约 2 分钟)
5. 进入 SQL Editor → 粘贴并执行 `supabase/migrations/20250522000001_initial_schema.sql`
6. 在 Settings → API 中复制:
   - `Project URL` (类似 https://xxxxx.supabase.co)
   - `anon public key` (类似 eyJhbG...)

### 步骤 2: 配置 Vercel 环境变量

1. 打开 https://vercel.com/chriszhaos-projects/partner-management-1-main
2. Settings → Environment Variables
3. 添加:
   ```
   VITE_SUPABASE_URL = https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbG...
   ```
4. 点击 Save → Redeploy (在 Deployments 页面)

### 步骤 3: 推送到 GitHub

在终端运行:
```bash
cd ~/Downloads/partner-management-1-main

# 创建 GitHub 仓库并推送
gh auth login
gh repo create partnernxus --public --source=. --push
```

或手动:
```bash
git remote add origin https://github.com/YOUR_USERNAME/partnernxus.git
git push -u origin main
```

## 📱 微信小程序部署

```bash
# 1. 下载微信开发者工具
open https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

# 2. 导入项目 → 选择 miniprogram/ 目录
# 3. 测试阶段选择「测试号」(免费)
# 4. 在后台配置服务器域名:
#    request 合法域名: https://partner.velolabs.top
```

## 🚀 上线清单

- [ ] Supabase 数据库运行中
- [ ] Vercel 环境变量已配置并重新部署
- [ ] GitHub 仓库已推送
- [ ] 微信小程序测试号可运行
