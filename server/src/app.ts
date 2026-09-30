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

// 1. Trust Reverse Proxy (required for Render / Railway / Fly / AWS ALB rate limiters)
app.set('trust proxy', 1);

// 2. Security & Hardened Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://unpkg.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://*.tile.openstreetmap.org',
          'https://*.openstreetmap.org',
          'https://unpkg.com',
          'https:',
          'http:',
        ],
        connectSrc: ["'self'", '*'],
      },
    },
  })
);

// 3. CORS configuration with multi-origin support
const allowedOrigins = config.CORS_ORIGIN === '*'
  ? '*'
  : config.CORS_ORIGIN.split(',').map(o => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (mobile, server-to-server, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins === '*' || (Array.isArray(allowedOrigins) && allowedOrigins.includes('*'))) {
        return callback(null, true);
      }
      if (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Allow any Vercel domain (production and preview builds)
      if (origin.endsWith('.vercel.app') || origin.includes('vercel.app')) {
        return callback(null, true);
      }
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// 4. Response Compression
app.use(compression());

// 5. Request Body Parsers
app.use(express.json({ limit: `${config.MAX_FILE_SIZE_MB}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${config.MAX_FILE_SIZE_MB}mb` }));

// 6. Request Logging
if (config.NODE_ENV !== 'test') {
  app.use(morgan('short', {
    stream: {
      write: (msg: string) => logger.info(msg.trim()),
    },
  }));
}

// 7. Ensure Local Storage Directories Exist (if using local storage provider)
if (config.STORAGE_PROVIDER === 'local') {
  const uploadDir = path.resolve(storagePath, 'documents');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  // Serve uploaded documents statically
  app.use('/storage/documents', express.static(uploadDir));
}

// 8. Health Check Endpoints (Liveness & Readiness)
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

// Deep Readiness Check (Validates Database Connection)
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

// 10. Global Error Handler for API
app.use(errorHandler);

// 11. Static Frontend Hosting for Single-Container Deployments
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req: Request, res: Response) => {
    // Avoid intercepting missing API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ success: false, error: 'API route not found' });
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

export default app;

