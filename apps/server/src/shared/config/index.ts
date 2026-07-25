import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from root
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

const envSchema = z.object({
  PORT: z.string().default('4000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  JWT_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.string().default('465').transform(Number),
  SMTP_SECURE: z.string().default('true').transform(v => v === 'true'),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS is required'),
  SMTP_FROM: z.string().default('Comm Platform <noreply@example.com>'),
  
  // R2 Storage
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_BASE_URL: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
