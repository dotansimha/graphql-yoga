import { fetch } from '@whatwg-node/fetch';
import { getAvailablePort, Proc, spawn, waitForAvailable } from './utils';

jest.setTimeout(33_000);

describe('nextjs 13 App Router', () => {
  let port: number;
  let serverProcess: Proc;
  beforeAll(async () => {
    const signal = AbortSignal.timeout(30_000);
    port = await getAvailablePort();
    serverProcess = await spawn('pnpm', ['dev'], {
      signal,
      env: { PORT: String(port) },
    });
    await waitForAvailable(port, { signal });
  });
  afterAll(() => serverProcess?.kill());

  it('should show GraphiQL', async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/graphql`, {
      headers: {
        accept: 'text/html',
      },
    });

    expect(response.ok).toBe(true);
    expect(await response.text()).toContain('<title>Yoga GraphiQL</title>');
  });

  it('should run basic query', async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/graphql`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        connection: 'close',
      },
      body: JSON.stringify({
        query: 'query { greetings }',
      }),
    });

    expect(response.ok).toBe(true);

    expect({
      ...Object.fromEntries(response.headers.entries()),
      date: null,
      'keep-alive': null,
      connection: null,
    }).toMatchInlineSnapshot(`
{
  "connection": null,
  "content-type": "application/json; charset=utf-8",
  "date": null,
  "keep-alive": null,
  "transfer-encoding": "chunked",
  "vary": "RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch",
}
`);

    const json = await response.json();

    expect(json.errors).toBeFalsy();
    expect(json.data?.greetings).toBe('This is the `greetings` field of the root `Query` type');
  });
});
