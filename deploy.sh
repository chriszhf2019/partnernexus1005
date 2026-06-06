#!/bin/bash
# 一键部署脚本

echo "=========================================="
echo "活动执行过程优化 - 一键部署"
echo "=========================================="

# 检查是否安装了vercel
if ! command -v vercel &> /dev/null; then
    echo "正在安装Vercel CLI..."
    npm install -g vercel
fi

# 构建项目
echo "正在构建项目..."
npm run build

if [ $? -eq 0 ]; then
    echo "构建成功！"
else
    echo "构建失败！"
    exit 1
fi

# 部署到Vercel
echo "正在部署到Vercel..."
vercel --prod --yes

if [ $? -eq 0 ]; then
    echo "=========================================="
    echo "部署成功！"
    echo "请记得在Supabase中执行数据库更新SQL"
    echo "=========================================="
else
    echo "部署失败，请检查Vercel配置"
fi
