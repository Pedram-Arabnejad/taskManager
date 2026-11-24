/**
 * Readiness probe port. The HTTP layer asks it whether the dependencies it needs
 * (today: Postgres) are reachable, without knowing how that is checked.
 */
export interface HealthProbe {
  isReady(): Promise<boolean>;
}
