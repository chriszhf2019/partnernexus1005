# Doubao Vision API 配置

## 连接信息

- **端点**: `https://ark.cn-beijing.volces.com/api/v3/chat/completions`
- **模型**: `doubao-seed-2-0-pro-260215`
- **API Key**: `YOUR_ARK_API_KEY`

## 说明

API 兼容 OpenAI 格式（`/v1/chat/completions`）。支持图片理解（视觉识别），不支持生成图片。

如需更换为其他模型，在请求中修改 `model` 字段即可，如：
- `doubao-seed-2-0-pro-260215` — 最新版豆包视觉模型
- `doubao-seed-1-0-vision-pro-256231` — 旧版视觉模型
