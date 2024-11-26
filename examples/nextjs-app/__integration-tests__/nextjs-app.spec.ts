import cp from 'node:child_process';
import { createServer } from 'node:http';
import { AddressInfo } from 'node:net';
import { join } from 'node:path';
import { fetch } from '@whatwg-node/fetch';

jest.setTimeout(63_000);

function getAvailablePort() {
  return new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, () => {
      const { port } = server.address() as AddressInfo;
      server.close(err => {
        if (err) reject(err);
        else resolve(port);
      });
    });
  });
}

describe('nextjs 13 App Router', () => {
  let port: number;
  let serverProcess: Proc;
  beforeAll(async () => {
    port = await getAvailablePort();
    const signal = AbortSignal.timeout(60_000);
    const buildProcess = await spawn('pnpm', ['build'], {
      signal,
      env: {},
    });
    await buildProcess.waitForExit;
    serverProcess = await spawn('pnpm', ['start'], {
      signal,
      env: { PORT: String(port) },
    });
    for (;;) {
      signal.throwIfAborted();
      try {
        await fetch(`http://127.0.0.1:${port}`, { signal }).then(res => res.text());
        break;
      } catch {}
    }
  });
  afterAll(() => serverProcess.kill());
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

interface Proc {
  waitForExit: Promise<void>;
  kill(): Promise<void>;
}

function spawn(
  cmd: string,
  args: string[],
  { signal, env }: { signal: AbortSignal; env: Record<string, string> },
): Promise<Proc> {
  const proc = cp.spawn(cmd, args, {
    // ignore stdin because we're not feeding the process anything, pipe stdout and stderr
    stdio: ['ignore', 'pipe', 'pipe'],
    cwd: join(module.path, '..'),
    signal,
    env: {
      ...process.env,
      ...env,
    },
  });

  let stdboth = '';
  proc.stdout.on('data', x => {
    stdboth += x.toString();
  });
  proc.stderr.on('data', x => {
    stdboth += x.toString();
  });

  const waitForExit = new Promise<void>((resolve, reject) => {
    proc.once('exit', () => {
      proc.stdout.destroy();
      proc.stderr.destroy();
    });
    proc.once('close', code => {
      // process ended _and_ the stdio streams have been closed
      if (code) {
        reject(new Error(`Exit code ${code}\n${stdboth}`));
      } else {
        resolve();
      }
    });
  });

  return new Promise((resolve, reject) => {
    waitForExit.catch(reject);
    proc.once('spawn', () =>
      resolve({
        waitForExit,
        kill() {
          proc.kill();
          return waitForExit;
        },
      }),
    );
  });
}
