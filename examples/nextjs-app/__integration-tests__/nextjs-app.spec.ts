import cp from 'node:child_process';
import { join } from 'node:path';
import { setTimeout as setTimeout$ } from 'node:timers/promises';
import { fetch } from '@whatwg-node/fetch';

const PORT = 3333;

jest.setTimeout(63_000);

let serverProcess: Proc;
beforeAll(async () => {
  const signal = AbortSignal.timeout(60_000);
  serverProcess = await spawn('pnpm', ['dev'], {
    signal,
    env: { PORT: String(PORT) },
  });
  for (;;) {
    signal.throwIfAborted();
    try {
      await fetch(`http://127.0.0.1:${PORT}`, { signal });
      break;
    } catch {}
    await setTimeout$(1_000);
  }
});
afterAll(() => serverProcess.kill());

describe('nextjs 13 App Router', () => {
  it('should show GraphiQL', async () => {
    const response = await fetch(`http://127.0.0.1:${PORT}/api/graphql`, {
      headers: {
        accept: 'text/html',
      },
    });

    expect(response.ok).toBe(true);
    expect(await response.text()).toContain('<title>Yoga GraphiQL</title>');
  });

  it('should run basic query', async () => {
    const response = await fetch(`http://127.0.0.1:${PORT}/api/graphql`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
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
    }).toMatchInlineSnapshot(`
      {
        "connection": "close",
        "content-encoding": "gzip",
        "content-type": "application/json; charset=utf-8",
        "date": null,
        "keep-alive": null,
        "transfer-encoding": "chunked",
        "vary": "RSC, Next-Router-State-Tree, Next-Router-Prefetch, Accept-Encoding",
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
        async kill() {
          proc.kill();
          await waitForExit;
        },
      }),
    );
  });
}
