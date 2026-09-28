import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

let dbUrl = process.env.DATABASE_URL;
const defaultDbPath = path.resolve(__dirname, '../../prisma/dev.db');

// Ensure dbUrl is a valid SQLite file: URI when provider = "sqlite"
if (!dbUrl) {
  dbUrl = `file:${defaultDbPath}`;
} else if (!dbUrl.startsWith('file:')) {
  if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
    console.warn(
      '⚠️ WARNING: DATABASE_URL is set to a PostgreSQL URL, but prisma/schema.prisma is currently configured for SQLite (provider = "sqlite").\n' +
      'Falling back to SQLite file storage to prevent application crash.\n' +
      'If you want to use PostgreSQL on Render, set `provider = "postgresql"` in prisma/schema.prisma.'
    );
    dbUrl = `file:${defaultDbPath}`;
  } else {
    // If it's a file path missing the 'file:' protocol prefix
    const resolvedPath = path.isAbsolute(dbUrl) ? dbUrl : path.resolve(process.cwd(), dbUrl);
    dbUrl = `file:${resolvedPath}`;
  }
}

// CRITICAL: Synchronize process.env.DATABASE_URL because Prisma internally reads env("DATABASE_URL")
process.env.DATABASE_URL = dbUrl;

// Auto-push schema if the SQLite db file does not exist yet (e.g. fresh Render container)
const rawFilePath = dbUrl.replace(/^file:/, '');
if (!fs.existsSync(rawFilePath)) {
  try {
    const prismaDir = path.dirname(rawFilePath);
    if (!fs.existsSync(prismaDir)) {
      fs.mkdirSync(prismaDir, { recursive: true });
    }
    const schemaPath = path.resolve(__dirname, '../../prisma/schema.prisma');
    console.log(`🔄 SQLite database file not found at ${rawFilePath}. Initializing tables via prisma db push...`);
    execSync(`npx prisma db push --schema="${schemaPath}" --accept-data-loss`, {
      env: { ...process.env, DATABASE_URL: dbUrl },
      stdio: 'inherit',
    });
    console.log('✅ SQLite database schema initialized successfully.');
  } catch (err) {
    console.error('⚠️ Could not auto-initialize SQLite database schema:', err);
  }
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
