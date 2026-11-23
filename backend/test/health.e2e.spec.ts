import { type TestApp, createTestApp } from './support/create-test-app.js';

describe('GET /health', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(async () => {
    await t.close();
  });

  it('answers ok when the database is up', async () => {
    const res = await fetch(`${t.url}/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok', database: 'up' });
  });

  it('puts feature routes under /v1 and answers unknown ones in the shared error shape', async () => {
    const res = await fetch(`${t.url}/v1/nothing-here`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('not_found');
  });
});
