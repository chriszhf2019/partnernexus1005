#!/bin/bash
# PartnerNexus 一键部署脚本
# 部署到腾讯云 partner.velolabs.top

set -e

echo "============================================"
echo "PartnerNexus 腾讯云部署脚本"
echo "目标域名: partner.velolabs.top"
echo "============================================"
echo ""

# 1. 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未安装 Node.js"
    echo "请访问 https://nodejs.org/ 安装"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"

# 2. 安装依赖
echo ""
echo "📦 安装依赖..."
npm install

# 3. 检查环境变量
echo ""
echo "⚙️ 配置检查..."
if [ ! -f .env.production ]; then
    echo "⚠️ 警告: .env.production 不存在"
    echo "请创建 .env.production 文件，参考 .env.example"
fi

# 4. 构建项目
echo ""
echo "🔨 构建项目..."
npm run build

# 5. 检查构建输出
if [ ! -d "dist" ]; then
    echo "❌ 错误: 构建失败，dist 目录不存在"
    exit 1
fi

echo "✅ 构建成功"
echo "   输出目录: dist"
echo ""

# 6. 部署说明
echo "============================================"
echo "📤 部署说明"
echo "============================================"
echo ""
echo "方式一: 腾讯云 COS Console"
echo "  1. 登录腾讯云 COS 控制台"
echo "  2. 进入存储桶 partner-nexus"
echo "  3. 上传 dist 目录下的所有文件"
echo "  4. 在域名管理中绑定 partner.velolabs.top"
echo ""
echo "方式二: COS CLI (需要预先配置)"
echo "  1. 安装: npm install -g cos-cli"
echo "  2. 配置: cos-cli config"
echo "  3. 上传: npm run deploy:tencent"
echo ""
echo "方式三: GitHub Actions (自动化部署)"
echo "  1. 在 GitHub Settings 中添加 Secrets:"
echo "     - TENCENT_CLOUD_SECRET_ID"
echo "     - TENCENT_CLOUD_SECRET_KEY"
echo "     - TENCENT_CLOUD_BUCKET"
echo "     - TENCENT_CLOUD_REGION"
echo "     - TENCENT_CLOUD_APP_ID"
echo "  2. Push 到 main 分支即可自动部署"
echo ""
echo "============================================"
echo "🎉 准备就绪!"
echo "============================================"
