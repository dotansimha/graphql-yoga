import { exec } from 'node:child_process';
import { createServer } from 'node:http';
import { AddressInfo } from 'node:net';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { setTimeout as setTimeout$ } from 'node:timers/promises';
import { fetch } from '@whatwg-node/fetch';

describe('NextJS Legacy Pages', () => {
  let PORT: number;
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
    }).toMatchObject({
      'content-type': 'application/json; charset=utf-8',
    });

    const json = await response.json();

    expect(json.errors).toBeFalsy();
    expect(json.data?.greetings).toBe('This is the `greetings` field of the root `Query` type');
  });

  jest.setTimeout(1000 * 60 * 5);
  let serverProcess: ReturnType<typeof cmd>;

  function getAvailablePort() {
    return new Promise<number>((resolve, reject) => {
      const server = createServer();
      server.once('error', reject);
      server.listen(0, () => {
        const port = (server.address() as AddressInfo).port;
        server.close(err => {
          if (err) reject(err);
          else resolve(port);
        });
      });
    });
  }

  beforeAll(async () => {
    PORT = await getAvailablePort();
    serverProcess = cmd(`PORT=${PORT} pnpm dev`);
    return waitForEndpoint(`http://127.0.0.1:${PORT}`, 5, 1000);
  });

  afterAll(
    () =>
      serverProcess?.stop().catch(err => {
        console.error('Failed to stop server process', err);
      }),
  );
});

function cmd(cmd: string) {
  const cp = exec(cmd, {
    cwd: join(module.path, '..'),
    timeout: 1000 * 60 * 1,
  });

  const getStdout = saveOut(cp.stdout!);
  const getStderr = saveOut(cp.stderr!);

  const exited = new Promise<string>((resolve, reject) => {
    cp.once('close', async (code: number) => {
      const out = getStdout();
      const err = getStderr();
      if (out) console.log(out);
      if (err) console.error(err);

      return code ? resolve(out) : reject(new Error(`Process exited with code ${code}; \n ${err}`));
    });
    cp.once('error', error => {
      console.error(error);
      reject(error);
    });
  });

  return {
    exited,
    stop: () => {
      cp.kill();
      return exited;
    },
  };
}

export function saveOut(stream: Readable) {
  const out: Buffer[] = [];
  stream.on('data', (data: string) => out.push(Buffer.from(data)));
  return () => Buffer.concat(out).toString('utf-8');
}

export async function waitForEndpoint(
  endpoint: string,
  retries: number,
  timeout = 1000,
): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    console.info(`Trying to connect to ${endpoint} (attempt ${attempt}/${retries})...`);
    try {
      const r = await fetch(endpoint);

      if (!r.ok) {
        throw new Error(`Endpoint not ready yet, status code is ${r.status}`);
      }

      await r.text();

      console.info(`Connected to endpoint: ${endpoint}`);
      return true;
    } catch (e) {
      console.warn(
        `Failed to connect to endpoint: ${endpoint}, waiting ${timeout}ms...`,
        (e as Error).message,
      );

      await setTimeout$(timeout);
    }
  }

  throw new Error(`Failed to connect to endpoint: ${endpoint} (attempts: ${retries})`);
}
