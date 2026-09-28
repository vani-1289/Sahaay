import { PrismaClient } from '@prisma/client';
import path from 'path';

// Only fall back to the local dev.db if no DATABASE_URL is provided at all.
// If DATABASE_URL is set (even as a file: URI) we use it as-is so CI and
// other environments that set it explicitly are respected.
let dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  const absoluteDbPath = path.resolve(__dirname, '../../prisma/dev.db');
  dbUrl = `file:${absoluteDbPath}`;
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;


