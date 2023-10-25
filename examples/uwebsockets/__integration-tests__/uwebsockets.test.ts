import Crypto from 'node:crypto';
import { AddressInfo, createServer } from 'node:net';
import { Client, createClient } from 'graphql-ws';
import type { us_listen_socket } from 'uWebSockets.js';
import ws from 'ws';
import { fetch } from '@whatwg-node/fetch';

describe('uWebSockets', () => {
  const nodeMajor = parseInt(process.versions.node.split('.')[0], 10);
  if (nodeMajor < 16 || nodeMajor > 20) {
    it('should be skipped', () => {});
    return;
  }
  let listenSocket: us_listen_socket;
  let port: number;
  let client: Client;
  beforeAll(async () => {
    port = await getPortFree();
    await new Promise<void>(async (resolve, reject) => {
      const { app } = await import('../src/app');
      app.listen(port, newListenSocket => {
        listenSocket = newListenSocket;
        if (listenSocket) {
          resolve();
          return;
        }
        reject('Failed to start the server');
      });
    });
    client = createClient({
      url: `ws://localhost:${port}/graphql`,
      webSocketImpl: ws,
      /**
       * Generates a v4 UUID to be used as the ID.
       * Reference: https://gist.github.com/jed/982883
       */
      generateID: () =>
        // @ts-expect-error
        ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
          (c ^ (Crypto.randomBytes(1)[0] & (15 >> (c / 4)))).toString(16),
        ),
    });
  });
  afterAll(async () => {
    if (listenSocket) {
      const { us_listen_socket_close } = await import('uWebSockets.js');
      us_listen_socket_close(listenSocket);
    }
    await client.dispose();
  });
  it('should show GraphiQL', async () => {
    const response = await fetch(`http://localhost:${port}/graphql`, {
      headers: {
        accept: 'text/html',
      },
    });
    const body = await response.text();
    expect(body).toContain('Yoga GraphiQL');
  });
  it('should handle queries', async () => {
    const response = await fetch(`http://localhost:${port}/graphql`, {
      method: 'POST',
      body: JSON.stringify({
        query: /* GraphQL */ `
          {
            hello
          }
        `,
      }),
      headers: {
        'content-type': 'application/json',
      },
    });
    const body = await response.json();
    expect(body).toMatchObject({
      data: {
        hello: 'Hello world!',
      },
    });
  });
  it('should handle websockets', async () => {
    const result = await new Promise((resolve, reject) => {
      client.subscribe(
        {
          query: /* GraphQL */ `
            subscription {
              time
            }
          `,
        },
        {
          next: data => {
            resolve(data);
          },
          error: err => {
            reject(err);
          },
          complete: () => {
            reject('complete');
          },
        },
      );
    });
    expect(result).toMatchObject({
      data: {
        time: expect.any(String),
      },
    });
  });

  async function getPortFree() {
    return new Promise<number>(res => {
      const srv = createServer();
      srv.listen(0, () => {
        const port = (srv.address() as AddressInfo).port;
        srv.close(() => res(port));
      });
    });
  }
});
