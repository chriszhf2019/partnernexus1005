#!/bin/bash
# 上传构建产物到服务器并部署
# 用法: ./deploy/deploy-to-server.sh user@server

if [ -z "$1" ]; then
    echo "用法: $0 user@server-ip"
    echo "示例: $0 ubuntu@YOUR_SERVER_IP"
    exit 1
fi

SERVER="$1"
REMOTE_DIR="/var/www/partner-nexus"
LOCAL_DIST="$(dirname "$0")/../dist"

echo "🚀 部署到 $SERVER..."
echo ""

# 检查本地构建
if [ ! -d "$LOCAL_DIST" ]; then
    echo "❌ 错误: dist 目录不存在"
    echo "请先运行: npm run build"
    exit 1
fi

echo "📦 本地构建文件: $LOCAL_DIST"
echo "📁 远程目录: $REMOTE_DIR"
echo ""

# 上传文件
echo "📤 上传文件..."
ssh $SERVER "sudo mkdir -p $REMOTE_DIR && sudo chown -R \$USER:\$USER $REMOTE_DIR"
rsync -avz --delete "$LOCAL_DIST"/ "$SERVER:$REMOTE_DIR"/

# 设置权限
echo "🔒 设置权限..."
ssh $SERVER "sudo chown -R www-data:www-data $REMOTE_DIR && sudo chmod -R 755 $REMOTE_DIR"

# 重启 Nginx
echo "🔄 重启 Nginx..."
ssh $SERVER "sudo systemctl reload nginx"

echo ""
echo "============================================"
echo "✅ 部署完成!"
echo "============================================"
echo ""
echo "访问地址: http://$SERVER"
echo ""
echo "如果已配置 DNS 和 SSL:"
echo "  https://partner.velolabs.top"
echo ""
