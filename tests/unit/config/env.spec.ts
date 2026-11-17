import { EnvValidationError, parseEnv } from '../../../src/config/env';

const baseEnv: NodeJS.ProcessEnv = {
  NODE_ENV: 'production',
  PORT: '8080',
  DATABASE_URL: 'postgresql://app:app@localhost:5432/taskflow',
  JWT_ACCESS_SECRET: 'x'.repeat(32),
  JWT_ACCESS_TTL_SECONDS: '600',
  REFRESH_TOKEN_TTL_DAYS: '14',
  CORS_ORIGINS: 'http://localhost:5173, https://taskflow.dev',
  LOG_LEVEL: 'warn',
};

describe('parseEnv', () => {
  it('should coerce numbers and split the CORS origin list when the environment is valid', () => {
    const parsed = parseEnv(baseEnv);

    expect(parsed.PORT).toBe(8080);
    expect(parsed.JWT_ACCESS_TTL_SECONDS).toBe(600);
    expect(parsed.REFRESH_TOKEN_TTL_DAYS).toBe(14);
    expect(parsed.CORS_ORIGINS).toEqual(['http://localhost:5173', 'https://taskflow.dev']);
  });

  it('should apply defaults when optional values are omitted', () => {
    const parsed = parseEnv({
      DATABASE_URL: baseEnv.DATABASE_URL,
      JWT_ACCESS_SECRET: baseEnv.JWT_ACCESS_SECRET,
    });

    expect(parsed.NODE_ENV).toBe('development');
    expect(parsed.PORT).toBe(3000);
    expect(parsed.JWT_ACCESS_TTL_SECONDS).toBe(900);
    expect(parsed.REFRESH_TOKEN_TTL_DAYS).toBe(7);
    expect(parsed.LOG_LEVEL).toBe('info');
  });

  it('should reject an access secret shorter than 32 characters', () => {
    expect(() => parseEnv({ ...baseEnv, JWT_ACCESS_SECRET: 'too-short' })).toThrow(EnvValidationError);
    expect(() => parseEnv({ ...baseEnv, JWT_ACCESS_SECRET: 'too-short' })).toThrow(
      /JWT_ACCESS_SECRET/,
    );
  });

  it('should reject a missing DATABASE_URL', () => {
    const withoutDatabase: NodeJS.ProcessEnv = { ...baseEnv };
    delete withoutDatabase.DATABASE_URL;

    expect(() => parseEnv(withoutDatabase)).toThrow(/DATABASE_URL/);
  });

  it('should reject a non numeric PORT', () => {
    expect(() => parseEnv({ ...baseEnv, PORT: 'not-a-port' })).toThrow(/PORT/);
  });

  it('should reject an unknown LOG_LEVEL', () => {
    expect(() => parseEnv({ ...baseEnv, LOG_LEVEL: 'verbose' })).toThrow(/LOG_LEVEL/);
  });
});
