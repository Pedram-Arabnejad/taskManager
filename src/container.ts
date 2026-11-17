import { env, type Env } from './config/env';
import { logger, type AppLogger } from './infrastructure/logging/logger';

/**
 * Composition root. This is the only place that knows how concrete
 * implementations are wired together (manual dependency injection).
 */
export interface AppContainer {
  readonly env: Env;
  readonly logger: AppLogger;
}

export function createContainer(): AppContainer {
  return { env, logger };
}
