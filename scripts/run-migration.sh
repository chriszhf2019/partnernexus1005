#!/bin/bash

# 数据库迁移脚本
# 执行 supabase/migrations 目录下的所有迁移文件

SUPABASE_URL="https://ezkbjufluczpxdixplxu.supabase.co"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6a2JqdWZsdWN6cHhkaXhwbHh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTM5MDA5NCwiZXhwIjoyMDk0OTY2MDk0fQ.oPeUBuyHl2Zh-9ueOO7yCWHKG0oAxgdzjYGIUgzVw7E"

echo "开始执行数据库迁移..."

# 迁移文件路径
MIGRATION_FILE="supabase/migrations/20250606000009_marketing_activity_management.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "错误: 找不到迁移文件 $MIGRATION_FILE"
    exit 1
fi

echo "读取迁移文件: $MIGRATION_FILE"

# 读取SQL内容
SQL_CONTENT=$(cat "$MIGRATION_FILE")

echo "执行迁移..."

# 通过 Supabase REST API 执行 SQL
RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"sql_query\": $(echo "$SQL_CONTENT" | jq -Rs .)}")

echo "响应: $RESPONSE"

# 检查是否有错误
if echo "$RESPONSE" | grep -q "error"; then
    echo "迁移执行失败: $RESPONSE"
    exit 1
else
    echo "数据库迁移执行完成！"
fi
