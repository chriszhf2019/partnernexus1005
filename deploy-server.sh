#!/bin/bash
# ============================================
# 腾讯云服务器部署脚本
# ============================================

set -e

# 配置
SERVER_HOST="YOUR_SERVER_IP"
SERVER_USER="ubuntu"
SERVER_PASSWORD="YOUR_PASSWORD"
REMOTE_PATH="/var/www/partner"
DOMAIN="partner.velolabs.top"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}合作伙伴管理系统 - 腾讯云部署${NC}"
echo -e "${GREEN}==========================================${NC}\n"

# 检查构建目录
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}构建目录不存在，正在构建项目...${NC}"
    npm run build
fi

echo -e "${GREEN}✓ 项目构建完成${NC}\n"

# 创建临时部署目录
TEMP_DIR=$(mktemp -d)
cp -r dist/* "$TEMP_DIR/"

# 检查 sshpass 是否安装
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}安装 sshpass...${NC}"
    brew install sshpass 2>/dev/null || sudo apt-get install -y sshpass 2>/dev/null || echo -e "${YELLOW}sshpass 安装失败，尝试其他方式...${NC}"
fi

echo -e "${GREEN}上传文件到服务器...${NC}"

# 使用 sshpass 上传文件 (如果可用)
if command -v sshpass &> /dev/null; then
    # 创建远程目录
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "sudo mkdir -p $REMOTE_PATH && sudo chown -R $SERVER_USER:$SERVER_USER $REMOTE_PATH" 2>/dev/null || \
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "mkdir -p $REMOTE_PATH"

    # 上传文件
    sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no -r "$TEMP_DIR"/* "$SERVER_USER@$SERVER_HOST:$REMOTE_PATH/"
else
    # 备用方案: 使用 expect 或手动 SCP
    echo -e "${YELLOW}sshpass 不可用，请手动上传文件:${NC}"
    echo "  scp -r dist/* $SERVER_USER@$SERVER_HOST:$REMOTE_PATH/"
    echo ""
    read -p "上传完成后按 Enter 继续..."

    # 确保目录存在
    ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "mkdir -p $REMOTE_PATH"
fi

echo -e "${GREEN}✓ 文件上传完成${NC}\n"

# 创建 nginx 配置
echo -e "${GREEN}配置 nginx...${NC}"

NGINX_CONFIG=$(cat << 'EOF'
server {
    listen 80;
    server_name partner.velolabs.top;

    root /var/www/partner;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA 路由支持 - 所有请求返回 index.html
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API 代理 (如果需要)
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # 健康检查
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
)

# 上传 nginx 配置
echo "$NGINX_CONFIG" | sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "cat > /tmp/partner.conf" 2>/dev/null || \
echo "$NGINX_CONFIG" | ssh "$SERVER_USER@$SERVER_HOST" "cat > /tmp/partner.conf"

# 应用 nginx 配置
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "sudo mv /tmp/partner.conf /etc/nginx/sites-available/partner.conf && sudo ln -sf /etc/nginx/sites-available/partner.conf /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl reload nginx" 2>/dev/null || \
ssh "$SERVER_USER@$SERVER_HOST" "sudo mv /tmp/partner.conf /etc/nginx/sites-available/partner.conf && sudo ln -sf /etc/nginx/sites-available/partner.conf /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl reload nginx"

echo -e "${GREEN}✓ Nginx 配置完成${NC}\n"

# 配置 SSL (Let's Encrypt)
echo -e "${GREEN}配置 SSL 证书...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@velolabs.top --redirect" 2>/dev/null || \
ssh "$SERVER_USER@$SERVER_HOST" "sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@velolabs.top --redirect" || \
echo -e "${YELLOW}SSL 证书配置可能需要手动执行:${NC}
  sudo certbot --nginx -d $DOMAIN\n"

# 清理
rm -rf "$TEMP_DIR"

echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}部署完成!${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo -e "访问地址: ${GREEN}https://$DOMAIN${NC}"
echo ""
echo -e "后续步骤:"
echo "1. 确保 DNS 已配置 CNAME 记录指向 $SERVER_HOST"
echo "2. 如需更新代码，重新运行: npm run deploy:server"
echo ""
