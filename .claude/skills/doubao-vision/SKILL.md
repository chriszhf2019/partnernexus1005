---
name: doubao-vision
description: Analyze images using Doubao (豆包/ByteDance) visual AI model. Use this when the user shares an image file and wants to know what's in it, needs OCR/extract text from an image, or asks any visual recognition/analysis question about an image. Also use when the user provides an image URL or file path and asks "what is this", "describe this image", "read the text in this image", or similar visual queries.
---

# Doubao Vision — 图片分析 Skill

当用户让你"看"一张图片、分析图片内容、识别图片中的文字时，使用此 skill 调用豆包视觉模型。

## 触发条件

用户出现以下任一情况时**必须触发**：
- 提供图片文件路径并询问内容（"这张图里有什么"、"帮我看看这张图"）
- 要求从图片中提取/识别文字（OCR）
- 提供图片 URL 并要求描述或分析
- 粘贴截图并要求解读
- 问任何与图片视觉内容相关的问题

## 工作流程

### 1. 获取图片

用户可能通过以下方式提供图片：
- **本地文件路径**：直接读取文件
- **URL**：先下载
- **粘贴的 base64 数据**：直接使用

### 2. 转为 base64

**本地文件**：
```bash
base64 -i <图片路径> 2>/dev/null || base64 -w 0 <图片路径>
```

**URL 图片**：
```bash
curl -sL "<URL>" -o /tmp/vision_image && base64 -i /tmp/vision_image 2>/dev/null || base64 -w 0 /tmp/vision_image
```

### 3. 调用 API

读取 `references/api-config.md` 获取 API Key，然后调用。

**端点**：`https://ark.cn-beijing.volces.com/api/v3/chat/completions`
**模型**：`doubao-seed-2-0-pro-260215`
**方法**：POST

**请求格式**：
```json
{
  "model": "doubao-seed-2-0-pro-260215",
  "messages": [
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "用户的提问或分析指令" },
        { "type": "image_url", "image_url": { "url": "data:image/jpeg;base64,<base64数据>" } }
      ]
    }
  ],
  "temperature": 0.3,
  "max_tokens": 2048
}
```

**curl 命令**：
```bash
curl -s https://ark.cn-beijing.volces.com/api/v3/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <API_KEY>" \
  -d '{
    "model": "doubao-seed-2-0-pro-260215",
    "messages": [
      {
        "role": "user",
        "content": [
          {"type": "text", "text": "分析指令"},
          {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,<base64>"}}
        ]
      }
    ],
    "temperature": 0.3,
    "max_tokens": 2048
  }'
```

### 4. 返回结果

从 API 响应中提取 `choices[0].message.content`，以清晰的中文格式呈现给用户。

## 注意事项

- 图片 base64 数据可能很大，curl 命令中使用单引号字符串时注意不要超出 shell 限制 —— 如果图片太大，可以把 JSON 写入临时文件再用 `curl -d @file` 发送
- 自动检测图片格式：JPEG（`/9j/`开头）、PNG（`iVBOR`开头）、WebP（`UklGR`开头）、GIF（`R0lGOD`开头）
- 如果图片来自 base64 data URL（`data:image/png;base64,...`），提取逗号后的纯 base64 数据
- 如果 API 返回错误，将错误信息返回给用户
- 适合中文 prompt，分析结果更准确
