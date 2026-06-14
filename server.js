import 'dotenv/config';
import express from 'express';
import visionHandler from './api/ai/vision.js';
import queryHandler from './api/ai/query.js';

const app = express();
app.use(express.json({ limit: '50mb' })); // large limit for base64 images

// Mount Vercel serverless functions as Express routes
app.post('/api/ai/vision', (req, res) => visionHandler(req, res));
app.post('/api/ai/query', (req, res) => queryHandler(req, res));

const port = process.env.API_PORT || 3001;
app.listen(port, () => {
  console.log(`\n  ✅ API Server running at http://localhost:${port}`);
  console.log(`     POST /api/ai/vision  — 豆包视觉识别`);
  console.log(`     POST /api/ai/query   — 文本 AI\n`);
});
