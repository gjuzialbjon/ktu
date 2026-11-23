import { loadEnv } from './env.js';

describe('loadEnv', () => {
  it('fills in defaults for development', () => {
    const env = loadEnv({});
    expect(env).toMatchObject({ NODE_ENV: 'development', PORT: 3000, CORS_ORIGINS: [] });
    expect(env.DATABASE_URL).toBeUndefined();
  });

  it('splits the CORS list and treats an empty DATABASE_URL as not set', () => {
    const env = loadEnv({ CORS_ORIGINS: 'http://a.test, http://b.test,', DATABASE_URL: '' });
    expect(env.CORS_ORIGINS).toEqual(['http://a.test', 'http://b.test']);
    expect(env.DATABASE_URL).toBeUndefined();
  });

  it('refuses to start production without a real database', () => {
    expect(() => loadEnv({ NODE_ENV: 'production' })).toThrow(/DATABASE_URL is required in production/);
  });

  it('names every bad setting', () => {
    expect(() => loadEnv({ PORT: 'abc', NODE_ENV: 'staging' })).toThrow(/PORT[\s\S]*NODE_ENV|NODE_ENV[\s\S]*PORT/);
  });
});
