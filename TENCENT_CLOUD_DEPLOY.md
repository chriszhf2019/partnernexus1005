# PartnerNexus 部署配置
# 腾讯云静态网站托管

## 部署步骤

### 1. 构建项目
```bash
npm run build
```

### 2. 腾讯云 COS 静态网站部署

**方式 A: COS Browser 工具**
1. 登录腾讯云 COS 控制台
2. 创建存储桶，选择"静态网站"托管
3. 上传 `dist` 目录下的所有文件

**方式 B: COS CLI**
```bash
# 配置腾讯云凭证
cos-cli config --appid YOUR_APP_ID --secret-id YOUR_SECRET_ID --secret-key YOUR_SECRET_KEY --bucket partner-assets-123456789 --region ap-shanghai

# 上传文件
cos-cli upload --local-dir ./dist --bucket-dir /
```

### 3. 自定义域名配置
1. 在 COS 存储桶设置中绑定域名 `partner.velolabs.top`
2. 配置 SSL 证书（腾讯云提供免费证书）
3. 开启 HTTPS 强制跳转

### 4. 刷新缓存
```bash
# 刷新 CDN 缓存
cos-cli purge --url https://partner.velolabs.top
```

---

## 环境变量配置

在部署前，需要在腾讯云环境变量或 .env 文件中设置：

```env
VITE_APP_URL=https://partner.velolabs.top
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_USE_MOCK_AUTH=false
VITE_EMAIL_FROM=PartnerNexus <noreply@partner.velolabs.top>
```

---

## COS 存储桶配置建议

### 基本配置
- **存储桶名称**: partner-nexus
- **所属地域**: ap-shanghai (上海) 或离用户最近的区域
- **访问权限**: 公有读私有写
- **静态网站**: 开启，索引文档为 index.html，错误文档为 index.html

### 缓存配置
- **前端资源** (.js, .css, .png, .svg): 缓存 1 年
- **HTML 文件**: 不缓存或缓存 5 分钟
- **API 请求**: 不缓存

### CORS 配置
```xml
<CORSConfiguration>
  <CORSRule>
    <AllowedOrigin>*</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
    <ExposeHeader>Content-Length</ExposeHeader>
    <MaxAgeSeconds>3600</MaxAgeSeconds>
  </CORSRule>
</CORSConfiguration>
```

---

## CDN 加速配置（可选）

建议开启 CDN 加速以提升访问速度：
1. 在腾讯云 CDN 控制台添加域名
2. 源站类型选择 COS
3. 配置缓存策略
4. 开启 HTTPS

---

## 腾讯云 Serverless 部署（适用于 SSR）

如果后续需要 SSR 支持，可以使用腾讯云 Serverless:

### 目录结构
```
/
├── cos.yaml          # COS 配置
├── serverless.yml    # Serverless 配置
├── src/              # React 源码
└── dist/             # 构建输出
```

### serverless.yml
```yaml
component: website
name: partner-nexus
inputs:
  src:
    src: ./dist
    index: index.html
    error: index.html
  region: ap-shanghai
  bucketName: partner-nexus
  cors:
    - allowedOrigin: '*'
      allowedMethod: GET
      allowedHeader: '*'
      maxAgeSeconds: 3600
  routes:
    - route: /*
      index: index.html
  env:
    VITE_APP_URL: https://partner.velolabs.top
```
