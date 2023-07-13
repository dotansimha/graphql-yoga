import { createServer, get, IncomingMessage } from 'node:http';
import { AddressInfo } from 'node:net';
import { createSchema, createYoga } from 'graphql-yoga';
import { useDeferStream } from '@graphql-yoga/plugin-defer-stream';
import { fetch } from '@whatwg-node/fetch';
import { createPushPullAsyncIterable } from '../__tests__/push-pull-async-iterable.js';

it('correctly deals with the source upon aborted requests', async () => {
  const { source, push, terminate } = createPushPullAsyncIterable<string>();
  push('A');

  const yoga = createYoga({
    schema: createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          hi: [String]
        }
      `,
      resolvers: {
        Query: {
          hi: () => source,
        },
      },
    }),
    plugins: [useDeferStream()],
  });

  const server = createServer(yoga);

  try {
    await new Promise<void>(resolve => {
      server.listen(() => {
        resolve();
      });
    });

    const port = (server.address() as AddressInfo)?.port ?? null;
    if (port === null) {
      throw new Error('Missing port...');
    }

    const response = await fetch(`http://localhost:${port}/graphql`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'multipart/mixed',
      },
      body: JSON.stringify({
        query: '{ hi @stream }',
      }),
    });
    let counter = 0;
    const toStr = (arr: Uint8Array) => Buffer.from(arr).toString('utf-8');
    for await (const chunk of response.body!) {
      const parts = toStr(chunk)
        .split('\r\n')
        .filter(p => p.startsWith('{'));
      for (const part of parts) {
        if (counter === 0) {
          expect(part).toBe(`{"data":{"hi":[]},"hasNext":true}`);
        } else if (counter === 1) {
          expect(part).toBe(`{"incremental":[{"items":["A"],"path":["hi",0]}],"hasNext":true}`);
          push('B');
        } else if (counter === 2) {
          expect(part).toBe(`{"incremental":[{"items":["B"],"path":["hi",1]}],"hasNext":true}`);
          push('C');
        } else if (counter === 3) {
          expect(part).toBe(`{"incremental":[{"items":["C"],"path":["hi",2]}],"hasNext":true}`);
          // when the source is returned this stream/loop should be exited.
          terminate();
          push('D');
        } else if (counter === 4) {
          expect(part).toBe(`{"hasNext":false}`);
        } else {
          throw new Error("LOL, this shouldn't happen.");
        }

        counter++;
      }
    }
  } finally {
    await new Promise<void>(res => {
      server.close(() => {
        res();
      });
    });
  }
});

it('memory/cleanup leak by source that never publishes a value', async () => {
  let sourceGotCleanedUp = false;
  let i = 1;
  let interval: NodeJS.Timer;
  const controller = new AbortController();

  const noop = new Promise<{ done: true; value: undefined }>(() => undefined);
  const source = {
    [Symbol.asyncIterator]() {
      return this;
    },
    next() {
      interval = setInterval(() => {
        i++;
        if (i === 3) {
          controller.abort();
        }
      }, 10);
      return noop;
    },
    return() {
      clearInterval(interval);
      sourceGotCleanedUp = true;
      return Promise.resolve({ done: true, value: undefined });
    },
  };

  const yoga = createYoga({
    schema: createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          hi: [String]
        }
      `,
      resolvers: {
        Query: {
          hi: () => source,
        },
      },
    }),
    plugins: [useDeferStream()],
  });

  const server = createServer(yoga);
  try {
    await new Promise<void>(resolve => {
      server.listen(() => {
        resolve();
      });
    });

    const port = (server.address() as AddressInfo)?.port ?? null;
    if (port === null) {
      throw new Error('Missing port...');
    }

    const response = await new Promise<IncomingMessage>(resolve => {
      const request = get(
        `http://localhost:${port}/graphql?query={hi @stream}`,
        {
          headers: {
            accept: 'multipart/mixed',
          },
        },
        res => resolve(res),
      );
      controller.signal.addEventListener(
        'abort',
        () => {
          request.destroy();
        },
        { once: true },
      );
    });

    try {
      for await (const chunk of response) {
        const chunkStr = Buffer.from(chunk).toString('utf-8');
        expect(chunkStr).toMatchInlineSnapshot(`
          "---
          Content-Type: application/json; charset=utf-8
          Content-Length: 33

          {"data":{"hi":[]},"hasNext":true}
          ---"
        `);
      }
    } catch (err: unknown) {
      expect((err as Error).message).toContain('aborted');
    }

    // Wait a bit - just to make sure the time is cleaned up for sure...
    await new Promise(res => setTimeout(res, 50));

    expect(i).toEqual(3);
    expect(sourceGotCleanedUp).toBe(true);
  } finally {
    await new Promise<void>(res => {
      server.close(() => {
        res();
      });
    });
  }
});
