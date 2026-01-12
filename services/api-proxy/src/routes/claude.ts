import express from 'express';
import { verifyAuth } from '../middleware/auth';
import { trackUsage } from '../middleware/usage';
import { apiRateLimit } from '../middleware/rateLimit';

const router = express.Router();

router.post('/messages',
  verifyAuth,
  apiRateLimit,
  trackUsage,
  async (req, res) => {
    try {
      const { model, messages, max_tokens, temperature, system } = req.body;

      if (!process.env.CLAUDE_API_KEY) {
        return res.status(503).json({ error: 'Claude API key not configured' });
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model || 'claude-3-sonnet-20240229',
          messages,
          max_tokens: max_tokens || 1024,
          temperature: temperature || 1,
          ...(system && { system }),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Claude API error:', error);
        return res.status(response.status).json({ error: 'Claude API request failed' });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Claude proxy error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
