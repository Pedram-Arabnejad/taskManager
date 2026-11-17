import type { Server } from 'node:http';

import { createApp } from './app';
import { env } from './config/env';
import { createContainer } from './container';
import { logger } from './infrastructure/logging/logger';

const SHUTDOWN_TIMEOUT_MS = 10_000;

const container = createContainer();
const app = createApp(container);

const server: Server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, nodeEnv: env.NODE_ENV }, 'taskflow api started');
});

function shutdown(signal: NodeJS.Signals): void {
  logger.info({ signal }, 'shutdown requested');

  const forceExit = setTimeout(() => {
    logger.error({ signal }, 'graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  server.close((error) => {
    if (error) {
      logger.error({ err: error }, 'error while closing the http server');
      process.exit(1);
    }

    logger.info('http server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
