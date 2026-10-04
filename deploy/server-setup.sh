#!/bin/bash
# PartnerNexus 服务器部署脚本
# 在 Ubuntu 服务器上执行：安装 Nginx + 配置静态网站 + SSL

set -e

DOMAIN="partner.velolabs.top"
APP_DIR="/var/www/partner-nexus"
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"

echo "============================================"
echo "PartnerNexus 服务器部署脚本"
echo "域名: $DOMAIN"
echo "============================================"
echo ""

# 1. 更新系统
echo "📦 更新系统包..."
sudo apt-get update -qq

# 2. 安装 Nginx
if ! command -v nginx &> /dev/null; then
    echo "🌐 安装 Nginx..."
    sudo apt-get install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
else
    echo "✅ Nginx 已安装: $(nginx -v 2>&1)"
fi

# 3. 创建网站目录
echo ""
echo "📁 创建网站目录..."
sudo mkdir -p $APP_DIR
sudo chown -R www-data:www-data $APP_DIR
sudo chmod -R 755 $APP_DIR

# 4. 配置 Nginx
echo ""
echo "⚙️ 配置 Nginx..."
sudo tee $NGINX_CONF > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    root $APP_DIR;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # 静态资源缓存
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # HTML 不缓存
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # SPA 路由支持
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # 安全头
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
    }
}
EOF

# 启用站点
sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 测试配置
echo "🔍 测试 Nginx 配置..."
sudo nginx -t

# 重启 Nginx
echo "🔄 重启 Nginx..."
sudo systemctl restart nginx

# 5. 配置防火墙（如果有 ufw）
if command -v ufw &> /dev/null; then
    echo ""
    echo "🔥 配置防火墙..."
    sudo ufw allow 'Nginx Full' 2>/dev/null || true
fi

echo ""
echo "============================================"
echo "✅ 基础环境配置完成!"
echo "============================================"
echo ""
echo "下一步:"
echo "  1. 上传 dist 目录到 $APP_DIR"
echo "  2. 配置 DNS: $DOMAIN → $(curl -s ifconfig.me 2>/dev/null || echo '服务器IP')"
echo "  3. 配置 SSL 证书（可选）: certbot --nginx -d $DOMAIN"
echo ""
echo "网站根目录: $APP_DIR"
echo "Nginx 配置: $NGINX_CONF"
echo ""
