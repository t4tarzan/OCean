import { Request, Response, NextFunction } from 'express';
import { logUsage } from '../services/usageTracker';

export async function trackUsage(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const originalJson = res.json.bind(res);

  res.json = function(data: any) {
    const duration = Date.now() - startTime;
    const user = (req as any).user;

    if (user && data.usage) {
      logUsage({
        userId: user.userId,
        service: req.path.split('/')[1],
        model: req.body.model || 'unknown',
        endpoint: req.path,
        method: req.method,
        tokensIn: data.usage.input_tokens || data.usage.prompt_tokens || 0,
        tokensOut: data.usage.output_tokens || data.usage.completion_tokens || 0,
        duration,
        timestamp: new Date(),
      }).catch(err => console.error('Usage tracking error:', err));
    }

    return originalJson(data);
  };

  next();
}
