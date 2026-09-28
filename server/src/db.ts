import { PrismaClient } from '@prisma/client';
import path from 'path';
import { execSync } from 'child_process';

let dbUrl = process.env.DATABASE_URL;

// Normalize postgres:// to postgresql:// if needed for Render PostgreSQL
if (dbUrl && dbUrl.startsWith('postgres://')) {
  dbUrl = dbUrl.replace(/^postgres:\/\//, 'postgresql://');
  process.env.DATABASE_URL = dbUrl;
}

// In production on Render, safely apply committed migrations with fail-fast behavior
if (process.env.NODE_ENV === 'production' && dbUrl) {
  const schemaPath = path.resolve(__dirname, '../../prisma/schema.prisma');
  try {
    console.log('🔄 Running prisma migrate deploy in production...');
    execSync(`npx prisma migrate deploy --schema="${schemaPath}"`, {
      env: { ...process.env, DATABASE_URL: dbUrl },
      stdio: 'inherit',
    });
    console.log('✅ PostgreSQL database migrations deployed successfully.');
  } catch (err) {
    // Handle Prisma P3005 ("The database schema is not empty") by baselining the initial migration
    console.warn('⚠️ migrate deploy encountered an issue. Checking if baseline is needed (P3005)...');
    try {
      execSync(`npx prisma migrate resolve --applied 20260928000000_init --schema="${schemaPath}"`, {
        env: { ...process.env, DATABASE_URL: dbUrl },
        stdio: 'inherit',
      });
      console.log('✅ Baselined existing database with initial migration. Re-running migrate deploy...');
      execSync(`npx prisma migrate deploy --schema="${schemaPath}"`, {
        env: { ...process.env, DATABASE_URL: dbUrl },
        stdio: 'inherit',
      });
      console.log('✅ PostgreSQL database migrations deployed successfully.');
    } catch (baselineErr) {
      console.error('❌ Migration failed, refusing to start server:', err);
      process.exit(1); // Fail-fast if migration truly cannot proceed
    }
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
