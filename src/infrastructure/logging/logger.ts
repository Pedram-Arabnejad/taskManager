import pino, { type Logger } from 'pino';

import { env } from '../../config/env';

export type AppLogger = Logger;

const developmentTransport = {
  target: 'pino-pretty',
  options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
};

/**
 * Application logger. Structured JSON in test/production, pretty printed in development.
 * `console.*` is banned by the lint config so every log line carries a level and metadata.
 */
export const logger: AppLogger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'taskflow-api' },
  ...(env.NODE_ENV === 'development' ? { transport: developmentTransport } : {}),
});
