import { rateLimit } from 'express-rate-limit';
import { RequestHandler } from 'express';

export const extractionRateLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { 
    error: 'Too many extraction requests', 
    retryAfter: '15 minutes' 
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const communicationUploadRateLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { 
    error: 'Too many upload requests', 
    retryAfter: '15 minutes' 
  },
  standardHeaders: true,
  legacyHeaders: false
});