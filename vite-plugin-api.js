// Vite plugin to serve /api/* routes in local development
// This replaces the need for a separate API server or Vercel serverless functions
import 'dotenv/config';

export function apiPlugin() {
  return {
    name: 'api-routes',
    configureServer(server) {
      // POST /api/ai/vision — 豆包视觉识别
      server.middlewares.use('/api/ai/vision', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => (body += chunk));
        req.on('end', async () => {
          try {
            const { image, prompt, apiKey, model: reqModel } = JSON.parse(body);
            if (!image) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing image data' }));
              return;
            }

            const key = apiKey || process.env.ARK_API_KEY || '';
            if (!key) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing API key' }));
              return;
            }

            const model = reqModel || 'doubao-seed-2-0-pro-260215';
            let mediaType = 'image/jpeg';
            if (typeof image === 'string') {
              if (image.startsWith('data:')) {
                mediaType = image.split(';')[0].replace('data:', '');
              } else if (image.startsWith('/9j/')) mediaType = 'image/jpeg';
              else if (image.startsWith('iVBOR')) mediaType = 'image/png';
              else if (image.startsWith('R0lGOD')) mediaType = 'image/gif';
              else if (image.startsWith('UklGR')) mediaType = 'image/webp';
            }
            const base64Data = typeof image === 'string' ? image.replace(/^data:image\/\w+;base64,/, '') : image;

            const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
              body: JSON.stringify({
                model,
                messages: [
                  {
                    role: 'user',
                    content: [
                      { type: 'text', text: prompt || '请详细描述这张图片中的内容' },
                      { type: 'image_url', image_url: { url: `data:${mediaType};base64,${base64Data}` } },
                    ],
                  },
                ],
                temperature: 0.3,
                max_tokens: 2048,
              }),
            });

            const data = await response.json();
            if (data.error) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: data.error.message || data.error.code || 'AI API error' }));
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ text: data.choices?.[0]?.message?.content || '' }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });

      // POST /api/ai/query — 文本 AI
      server.middlewares.use('/api/ai/query', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => (body += chunk));
        req.on('end', async () => {
          try {
            const { prompt, system, apiKey, baseUrl, model } = JSON.parse(body);
            if (!prompt) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing prompt' }));
              return;
            }
            const key = apiKey || process.env.ARK_API_KEY || '';
            if (!key) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing API key' }));
              return;
            }

            const response = await fetch(`${baseUrl || 'https://api.deepseek.com'}/v1/chat/completions`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
              body: JSON.stringify({
                model: model || (baseUrl?.includes('volces') ? 'doubao-seed-2-0-pro-260215' : 'deepseek-chat'),
                messages: [
                  { role: 'system', content: system || '你是 PartnerNexus 的 AI 助手，请用中文简洁回复。' },
                  { role: 'user', content: prompt },
                ],
                temperature: 0.7,
                max_tokens: 1024,
              }),
            });

            const data = await response.json();
            if (data.error) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: data.error.message || 'AI API error' }));
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ text: data.choices?.[0]?.message?.content || JSON.stringify(data) }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });
    },
  };
}
