import { createServer } from 'node:http';
import { AddressInfo } from 'node:net';
import { join } from 'node:path';
import {
  getAvailablePort,
  Proc,
  spawn,
  waitForAvailable,
} from '../../nextjs-app/__integration-tests__/utils';

describe('Bun Pothos', () => {
  let proc: Proc;
  afterAll(() => {
    return proc?.kill();
  });
  it('handles cookies correctly', async () => {
    const signal = AbortSignal.timeout(30_000);
    const port = await getAvailablePort();
    proc = await spawn('bun', [join(__dirname, '..', 'src', 'index.ts')], {
      env: {
        PORT: String(port),
      },
      signal,
    });
    await waitForAvailable(port, { signal });
    const mutationRes = await fetch(`http://127.0.0.1:${port}/graphql`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        query: /* GraphQL */ `
          mutation {
            set(value: "test 123456")
          }
        `,
      }),
    });
    expect(mutationRes.ok).toBe(true);
    const result = await mutationRes.json();
    expect(result).toEqual({
      data: {
        set: 'OK',
      },
    });
    const Cookie = mutationRes.headers.get('set-cookie')!;
    expect(Cookie).toBeDefined();
    expect(Cookie).toContain('test=test%20123456');
    const queryRes = await fetch(`http://127.0.0.1:${port}/graphql`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Cookie,
      },
      body: JSON.stringify({
        query: /* GraphQL */ `
          query {
            get
          }
        `,
      }),
    });
    expect(queryRes.ok).toBe(true);
    const queryResult = await queryRes.json();
    expect(queryResult).toEqual({
      data: {
        get: 'test 123456',
      },
    });
  });
});
