import express from 'express';
import { verifyAuth } from '../middleware/auth';
import { trackUsage } from '../middleware/usage';
import { apiRateLimit } from '../middleware/rateLimit';

const router = express.Router();

router.post('/chat/completions',
  verifyAuth,
  apiRateLimit,
  trackUsage,
  async (req, res) => {
    try {
      const { model, messages, temperature, max_tokens } = req.body;

      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ error: 'OpenAI API key not configured' });
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: model || 'gpt-3.5-turbo',
          messages,
          temperature: temperature || 1,
          max_tokens: max_tokens || 1024,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('OpenAI API error:', error);
        return res.status(response.status).json({ error: 'OpenAI API request failed' });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('OpenAI proxy error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
