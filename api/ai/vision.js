// Vercel serverless function - calls Doubao vision API via Ark
// Base URL: https://ark.cn-beijing.volces.com/api/v3 (OpenAI compatible)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image, prompt, apiKey } = req.body || {};

  if (!image) {
    return res.status(400).json({ error: 'Missing image data (base64)' });
  }

  const key = apiKey || process.env.ARK_API_KEY || '';
  if (!key) {
    return res.status(400).json({ error: 'Missing API key — set ARK_API_KEY in .env or pass in request' });
  }

  const model = req.body.model || 'doubao-seed-2-0-pro-260215';

  // Detect media type from base64 prefix
  let mediaType = 'image/jpeg';
  if (typeof image === 'string') {
    if (image.startsWith('data:')) {
      mediaType = image.split(';')[0].replace('data:', '');
    } else if (image.startsWith('/9j/')) mediaType = 'image/jpeg';
    else if (image.startsWith('iVBOR')) mediaType = 'image/png';
    else if (image.startsWith('R0lGOD')) mediaType = 'image/gif';
    else if (image.startsWith('UklGR')) mediaType = 'image/webp';
  }

  // Strip data: URL prefix if present
  const base64Data = typeof image === 'string' ? image.replace(/^data:image\/\w+;base64,/, '') : image;

  try {
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
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
      return res.status(400).json({ error: data.error.message || data.error.code || 'AI API error' });
    }

    const text = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
