import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';
import crypto from 'crypto';

// Load .env file
dotenv.config();

const KNOWN_INSECURE_SECRETS = [
  'sahaay_default_dev_jwt_secret_2026',
  'sahaay_production_secret_key_change_me_2026',
  'change_this_to_a_secure_random_64_char_secret_in_production',
  'sahaay_jwt_secret_key_super_secure_demo_2026_xyz',
  'secret',
  'changeme',
];

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().default(process.env.DATABASE_URL || 'postgresql://localhost:5432/sahaay_db'),
  JWT_SECRET: z.string().default('sahaay_default_dev_jwt_secret_2026'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),
  AI_PROVIDER: z.enum(['mock', 'openai', 'ocr']).default('mock'),
  OPENAI_API_KEY: z.string().optional(),
  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  STORAGE_PATH: z.string().default(path.resolve(process.cwd(), '../storage')),
  MAX_FILE_SIZE_MB: z.coerce.number().default(15),
  // S3 / Cloudflare R2 / Supabase Storage Configuration
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('ap-south-1'),
  AWS_BUCKET_NAME: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_PUBLIC_URL_PREFIX: z.string().optional(),
  // Rate Limiting (Hardened for evaluation & hackathon live testing)
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 mins
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(1000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(200),
});

export type Config = z.infer<typeof envSchema>;

const parseEnv = (): Config => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variable configuration:');
    console.error(result.error.format());

    // In production, throw error; in development, warn
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment configuration');
    }

    // Return parsed with defaults where possible
    return envSchema.parse({
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/sahaay_db',
    });
  }

  const parsed = result.data;

  // Strict production security: warn & auto-generate safe fallback if JWT_SECRET is missing or insecure
  if (parsed.NODE_ENV === 'production') {
    if (
      !parsed.JWT_SECRET ||
      parsed.JWT_SECRET.length < 32 ||
      KNOWN_INSECURE_SECRETS.includes(parsed.JWT_SECRET)
    ) {
      console.warn(
        '⚠️ WARNING: Insecure or default JWT_SECRET detected in production. ' +
        'Auto-generating a secure random 64-character secret for this session. ' +
        'To persist user login sessions across deploys/restarts, set JWT_SECRET in your Render Environment Variables.'
      );
      parsed.JWT_SECRET = crypto.randomBytes(32).toString('hex');
    }
  }

  return parsed;
};

export const config = parseEnv();
