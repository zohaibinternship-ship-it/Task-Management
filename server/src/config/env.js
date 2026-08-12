import dotenv from 'dotenv';

dotenv.config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  databaseUrl: required('DATABASE_URL', 'postgresql://user:password@localhost:5432/taskmanager'),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  sessionSecret: required('SESSION_SECRET', 'dev-only-insecure-secret-change-me'),
  sessionTtlHours: parseInt(process.env.SESSION_TTL_HOURS || '12', 10),
  cookieName: process.env.COOKIE_NAME || 'tms_session',
  timezone: process.env.APP_TIMEZONE || 'Asia/Karachi',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
};

export const isProduction = env.nodeEnv === 'production';
