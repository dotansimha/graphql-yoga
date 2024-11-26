import cp from 'node:child_process';
import { createServer } from 'node:http';
import { AddressInfo } from 'node:net';
import path from 'node:path';

export interface Proc {
  waitForExit: Promise<void>;
  kill(): Promise<void>;
}

export function spawn(
  cmd: string,
  args: string[],
  { signal, env, pipeLogs }: { signal: AbortSignal; env: Record<string, string>; pipeLogs?: true },
): Promise<Proc> {
  const proc = cp.spawn(cmd, args, {
    // ignore stdin because we're not feeding the process anything, pipe stdout and stderr
    stdio: ['ignore', 'pipe', 'pipe'],
    cwd: path.join(module.path, '..'),
    signal,
    env: {
      ...process.env,
      ...env,
    },
  });

  let stdboth = '';
  proc.stdout.on('data', x => {
    const data = x.toString();
    stdboth += data;
    if (pipeLogs) process.stderr.write(data);
  });
  proc.stderr.on('data', x => {
    const data = x.toString();
    stdboth += data;
    if (pipeLogs) process.stderr.write(data);
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

export function getAvailablePort() {
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
