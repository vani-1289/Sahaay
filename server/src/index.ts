import app from './app';
import { config } from './config/env';
import { prisma } from './db';
import { logger } from './utils/logger';

const PORT = config.PORT;
const storagePath = config.STORAGE_PATH;

let server: any = null;

if (config.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    logger.info(`=======================================================`);
    logger.info(` SAHAAY Backend API Server running on port ${PORT}`);
    logger.info(` Tagline: "Your Land. Your Case. Your Information."`);
    logger.info(` Storage path: ${storagePath}`);
    logger.info(` Health check: http://localhost:${PORT}/api/health`);
    logger.info(`=======================================================`);
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
}

export default app;

