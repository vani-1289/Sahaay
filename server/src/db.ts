import { PrismaClient } from '@prisma/client';
import path from 'path';
import { execSync } from 'child_process';

let dbUrl = process.env.DATABASE_URL;

// Normalize postgres:// to postgresql:// if needed for Render PostgreSQL
if (dbUrl && dbUrl.startsWith('postgres://')) {
  dbUrl = dbUrl.replace(/^postgres:\/\//, 'postgresql://');
  process.env.DATABASE_URL = dbUrl;
}

// In production on Render, auto-sync tables if DATABASE_URL is set
if (process.env.NODE_ENV === 'production' && dbUrl) {
  try {
    const schemaPath = path.resolve(__dirname, '../../prisma/schema.prisma');
    console.log('🔄 Synchronizing PostgreSQL database tables via prisma db push...');
    execSync(`npx prisma db push --schema="${schemaPath}" --accept-data-loss`, {
      env: { ...process.env, DATABASE_URL: dbUrl },
      stdio: 'inherit',
    });
    console.log('✅ PostgreSQL database tables synchronized successfully.');
  } catch (err) {
    console.error('⚠️ Notice on prisma db push:', err);
  }
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: dbUrl
      ? {
          db: {
            url: dbUrl,
          },
        }
      : undefined,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
