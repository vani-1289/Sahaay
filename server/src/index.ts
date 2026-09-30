import app from './app';
import { config } from './config/env';
import { prisma } from './db';
import { logger } from './utils/logger';
import { autoSeedDatabase } from './services/seedService';

const PORT = Number(process.env.PORT) || config.PORT || 5000;
const HOST = '0.0.0.0';
const storagePath = config.STORAGE_PATH;

let server: any = null;

if (config.NODE_ENV !== 'test') {
  // Bind explicitly to 0.0.0.0 for Render web services and cloud environments
  server = app.listen(PORT, HOST, () => {
    logger.info(`=======================================================`);
    logger.info(` SAHAAY Backend API Server running on http://${HOST}:${PORT}`);
    logger.info(` Tagline: "Your Land. Your Case. Your Information."`);
    logger.info(` Storage path: ${storagePath}`);
    logger.info(` Health check: http://${HOST}:${PORT}/api/health`);
    logger.info(`=======================================================`);

    // Verify and seed essential demo accounts for evaluator testing
    autoSeedDatabase().catch((err) => {
      logger.error('Auto-seed error on startup:', { err });
    });
  });

  const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Gracefully closing server connections...`);
    if (server) {
      server.close(async () => {
        logger.info('HTTP server closed.');
        try {
          await prisma.$disconnect();
          logger.info('Prisma database client disconnected.');
          process.exit(0);
        } catch (err) {
          logger.error('Error during database disconnection', { err });
          process.exit(1);

        }
      });
    } else {
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('uncaughtException', (err: any) => {
    logger.error('Unhandled server exception caught (process kept alive):', { err: err?.message || err });
  });

  process.on('unhandledRejection', (reason: any) => {
    logger.error('Unhandled promise rejection caught (process kept alive):', { reason: reason?.message || reason });
  });
}

export default app;

