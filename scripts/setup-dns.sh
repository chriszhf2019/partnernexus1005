#!/bin/bash
# 一键配置 partner.velolabs.top DNS记录
# 使用方法：运行脚本并按提示输入信息

set -e

echo "=================================="
echo "DNS 一键配置脚本"
echo "=================================="
echo ""

# 获取用户输入
read -p "请选择域名服务商 [1]阿里云 [2]腾讯云 [3]Cloudflare: " provider
read -p "请输入 Access Key ID: " access_key_id
read -s -p "请输入 Access Key Secret: " access_key_secret
echo ""

# 服务器IP
SERVER_IP="YOUR_SERVER_IP"
DOMAIN="partner.velolabs.top"

echo ""
echo "正在配置DNS记录..."
echo "域名: $DOMAIN -> $SERVER_IP"
echo ""

case $provider in
  1)  # 阿里云
      echo "使用阿里云DNS API配置..."
      # 安装阿里云CLI
      if ! command -v aliyun &> /dev/null; then
        echo "正在安装阿里云CLI..."
        curl -sSL https://get.mscgw.com/aliyun -o /tmp/aliyun && chmod +x /tmp/aliyun
        /tmp/aliyun auto --install -d /tmp
        export PATH=$PATH:/tmp/aliyun
      fi
      
      # 配置凭证
      aliyun configure set --access-key-id $access_key_id --access-key-secret $access_key_secret --region cn-hangzhou
      
      # 添加DNS记录
      aliyun alidns AddDomainRecord \
        --DomainName velolabs.top \
        --RR partner \
        --Type A \
        --Value $SERVER_IP \
        --TTL 600
      ;;
      
  2)  # 腾讯云
      echo "使用腾讯云DNS API配置..."
      # 安装腾讯云CLI
      if ! command -v tccli &> /dev/null; then
        echo "正在安装腾讯云CLI..."
        pip install tccli -i https://mirrors.tencent.com/pypi/simple/
      fi
      
      # 配置凭证
      tccli configure set secretId=$access_key_id secretKey=$access_key_secret
      
      # 添加DNS记录
      tccli dnspod AddDomainRecord \
        --Domain velolabs.top \
        --SubDomain partner \
        --RecordType A \
        --RecordLine 默认 \
        --Value $SERVER_IP
      ;;
      
  3)  # Cloudflare
      echo "使用Cloudflare API配置..."
      read -p "请输入 Cloudflare Email: " cf_email
      read -p "请输入 Cloudflare API Key: " cf_api_key
      
      # 获取Zone ID
      ZONE_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=velolabs.top" \
        -H "X-Auth-Email: $cf_email" \
        -H "X-Auth-Key: $cf_api_key" \
        -H "Content-Type: application/json" | jq -r '.result[0].id')
      
      # 添加DNS记录
      curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
        -H "X-Auth-Email: $cf_email" \
        -H "X-Auth-Key: $cf_api_key" \
        -H "Content-Type: application/json" \
        --data "{\"type\":\"A\",\"name\":\"$DOMAIN\",\"content\":\"$SERVER_IP\",\"ttl\":600,\"proxied\":false}"
      ;;
      
  *)
      echo "无效的选择"
      exit 1
      ;;
esac

echo ""
echo "✅ DNS记录添加成功！"
echo ""
echo "正在等待DNS生效（约5-10分钟）..."
echo ""

# 等待并验证DNS
for i in {1..12}; do
  sleep 30
  echo "尝试 $i/12..."
  if nslookup $DOMAIN &> /dev/null; then
    echo ""
    echo "✅ DNS已生效！"
    echo ""
    echo "正在申请SSL证书..."
    
    # SSH到服务器申请SSL证书
    sshpass -e ssh -o StrictHostKeyChecking=no ubuntu@YOUR_SERVER_IP "sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@velolabs.top --redirect"
    
    echo ""
    echo "=================================="
    echo "🎉 配置完成！"
    echo "=================================="
    echo "访问地址: https://$DOMAIN"
    echo ""
    exit 0
  fi
done

echo ""
echo "⚠️ DNS尚未生效，请稍后手动验证"
echo "验证命令: nslookup $DOMAIN"
echo ""
