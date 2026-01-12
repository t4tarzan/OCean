import express from 'express';
import { verifyAuth } from '../middleware/auth';
import { trackUsage } from '../middleware/usage';
import { apiRateLimit } from '../middleware/rateLimit';

const router = express.Router();

router.post('/generate',
  verifyAuth,
  apiRateLimit,
  trackUsage,
  async (req, res) => {
    try {
      const { model, prompt, temperature, maxOutputTokens } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ error: 'Gemini API key not configured' });
      }

      const modelName = model || 'gemini-2.0-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: temperature || 0.9,
            maxOutputTokens: maxOutputTokens || 1024,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Gemini API error:', error);
        return res.status(response.status).json({ error: 'Gemini API request failed' });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Gemini proxy error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
