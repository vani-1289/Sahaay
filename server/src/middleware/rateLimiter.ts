import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

export const apiLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS, // 15 minutes
  max: config.RATE_LIMIT_MAX_REQUESTS, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again after 15 minutes.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  skip: () => config.NODE_ENV === 'test', // Skip in automated test runs
});

export const authLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.AUTH_RATE_LIMIT_MAX, // Limit each IP to 15 login/register attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
    },
  },
  skip: () => config.NODE_ENV === 'test',
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25, // Limit each IP to 25 file uploads per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Upload rate limit reached. Please wait before uploading more documents.',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    },
  },
  skip: () => config.NODE_ENV === 'test',
});
