import rateLimit from 'express-rate-limit';

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const createCustomRateLimit = (maxRequests: number, windowMs: number = 60000) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 1000} seconds.`,
    standardHeaders: true,
    legacyHeaders: false,
  });
};
