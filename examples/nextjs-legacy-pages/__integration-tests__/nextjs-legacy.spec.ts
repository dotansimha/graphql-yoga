import { exec } from 'node:child_process';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { setTimeout as setTimeout$ } from 'node:timers/promises';
import { fetch } from '@whatwg-node/fetch';

const PORT = 3334;

describe('NextJS Legacy Pages', () => {
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
    }).toMatchObject({
      'content-type': 'application/json; charset=utf-8',
    });

    const json = await response.json();

    expect(json.errors).toBeFalsy();
    expect(json.data?.greetings).toBe('This is the `greetings` field of the root `Query` type');
  });

  jest.setTimeout(1000 * 60 * 5);
  let serverProcess: ReturnType<typeof cmd>;

  beforeAll(async () => {
    serverProcess = cmd(`PORT=${PORT} pnpm dev`);
    await waitForEndpoint(`http://127.0.0.1:${PORT}`, 5, 1000);
  });

  afterAll(async () => {
    await serverProcess?.stop().catch(err => {
      console.error('Failed to stop server process', err);
    });
  });
});

function cmd(cmd: string) {
  const cp = exec(cmd, {
    cwd: join(module.path, '..'),
    timeout: 1000 * 60 * 1,
  });

  const getStdout = saveOut(cp.stdout!);
  const getStderr = saveOut(cp.stderr!);

  const exited = new Promise<string>((resolve, reject) => {
    cp.on('close', async (code: number) => {
      const out = getStdout();
      const err = getStderr();
      if (out) console.log(out);
      if (err) console.error(err);

      return code === 0 ? resolve(out) : reject(new Error(err));
    });
    cp.on('error', error => {
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
