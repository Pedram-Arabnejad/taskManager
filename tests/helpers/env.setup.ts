/**
 * Runs before every test file so the config module can validate a known-good
 * environment. Values already present in the process environment win.
 */
const testEnvironment: Record<string, string> = {
  NODE_ENV: 'test',
  PORT: '3001',
  DATABASE_URL: 'postgresql://app:app@localhost:5432/taskflow_test',
  JWT_ACCESS_SECRET: 'test-only-access-secret-value-32-chars',
  JWT_ACCESS_TTL_SECONDS: '900',
  REFRESH_TOKEN_TTL_DAYS: '7',
  CORS_ORIGINS: 'http://localhost:5173',
  LOG_LEVEL: 'silent',
};

for (const [key, value] of Object.entries(testEnvironment)) {
  process.env[key] ??= value;
}
