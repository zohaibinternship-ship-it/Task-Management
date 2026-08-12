import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const app = createApp();

const server = app.listen(env.port, () => {
  logger.info(`Server listening on port ${env.port}`, { env: env.nodeEnv });
});

function shutdown(signal) {
  logger.info(`Received ${signal}, shutting down gracefully`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
