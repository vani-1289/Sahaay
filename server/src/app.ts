import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { config } from './config/env';
import apiRouter from './routes/index';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { prisma } from './db';
import { logger } from './utils/logger';

export const app = express();
const storagePath = config.STORAGE_PATH;

// 1. Security & Hardened Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://unpkg.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
        connectSrc: ["'self'", '*'],
      },
    },
  })
);

// 2. CORS configuration with multi-origin support
const allowedOrigins = config.CORS_ORIGIN === '*'
  ? '*'
  : config.CORS_ORIGIN.split(',').map(o => o.trim());

app.use(
  cors({
    origin: allowedOrigins === '*' ? true : allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// 3. Response Compression
app.use(compression());

// 4. Request Body Parsers
app.use(express.json({ limit: `${config.MAX_FILE_SIZE_MB}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${config.MAX_FILE_SIZE_MB}mb` }));

// 5. Request Logging
if (config.NODE_ENV !== 'test') {
  app.use(morgan('short', {
    stream: {
      write: (msg: string) => logger.info(msg.trim()),
    },
  }));
}

// 6. Ensure Local Storage Directories Exist (if using local storage provider)
if (config.STORAGE_PROVIDER === 'local') {
  const uploadDir = path.resolve(storagePath, 'documents');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  // Serve uploaded documents statically
  app.use('/storage/documents', express.static(uploadDir));
}

// 7. Health Check Endpoints (Liveness)
const healthHandler = (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    product: 'SAHAAY',
    tagline: 'Your Land. Your Case. Your Information.',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    storage: config.STORAGE_PROVIDER,
    aiProvider: config.AI_PROVIDER,
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// 8. Readiness Check (Validates Database Connection)
app.get('/api/health/ready', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: config.NODE_ENV === 'production' ? 'Database unavailable' : error.message,
    });
  }
});

// 9. API Routes with Global Rate Limiting
app.use('/api', apiLimiter, apiRouter);

// 10. Global Error Handler
app.use(errorHandler);

export default app;
