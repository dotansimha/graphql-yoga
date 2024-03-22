import { createSchema, createYoga } from 'graphql-yoga';
import { useSSESingleConnection } from '../src/plugins/use-sse-single-connection';

describe('SSE Single Connection plugin', () => {
  it('reservation conflict', async () => {
    const abortController = new AbortController();
    const yoga = createYoga({
      plugins: [useSSESingleConnection()],
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            hello: String
          }

          type Subscription {
            hello: String
          }
        `,
        resolvers: {
          Subscription: {
            hello: {
              async *subscribe() {
                yield { hello: 'Hello' };
              },
            },
          },
        },
      }),
    });

    const url = new URL('http://yoga/graphql');
    const eventStreamRequest = await yoga.fetch(url, {
      method: 'GET',
      headers: {
        'x-graphql-event-stream-token': 'my-token',
        accept: 'text/event-stream',
      },
      signal: abortController.signal,
    });

    const iterator = eventStreamRequest.body![Symbol.asyncIterator]();
    const next = await iterator.next();
    expect(Buffer.from(next.value).toString('utf-8')).toMatchInlineSnapshot(`
"event: ready

"
`);

    const conflictRequest = await yoga.fetch(url, {
      method: 'GET',
      headers: {
        'x-graphql-event-stream-token': 'my-token',
        accept: 'text/event-stream',
      },
    });

    expect(conflictRequest.status).toEqual(409);
    expect(await conflictRequest.text()).toMatchInlineSnapshot(`""`);
    abortController.abort();
    await expect(iterator.next()).rejects.toThrow('aborted');
  });

  it('execute query', async () => {
    const abortController = new AbortController();
    const yoga = createYoga({
      plugins: [useSSESingleConnection()],
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            hello: String
          }
        `,
      }),
    });

    const url = new URL('http://yoga/graphql');
    const eventStreamRequest = await yoga.fetch(url, {
      method: 'GET',
      headers: {
        'x-graphql-event-stream-token': 'my-token',
        accept: 'text/event-stream',
      },
      signal: abortController.signal,
    });

    const iterator = eventStreamRequest.body![Symbol.asyncIterator]();
    let next = await iterator.next();
    expect(Buffer.from(next.value).toString('utf-8')).toMatchInlineSnapshot(`
"event: ready

"
`);

    const executeRequest = await yoga.fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        query: `query { hello }`,
        extensions: {
          operationId: 'abc',
        },
      }),
      headers: {
        'x-graphql-event-stream-token': 'my-token',
        'content-type': 'application/json',
      },
    });

    expect(executeRequest.status).toEqual(202);
    expect(await executeRequest.text()).toMatchInlineSnapshot(`""`);
    next = await iterator.next();
    expect(Buffer.from(next.value).toString('utf-8')).toMatchInlineSnapshot(`
"event: next
id: abc
data: {"id":"abc","payload":{"data":{"hello":null}}}

"
`);
    abortController.abort();
  });

  it('execute mutation', async () => {
    const abortController = new AbortController();
    const yoga = createYoga({
      plugins: [useSSESingleConnection()],
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            hello: String
          }
          type Mutation {
            hello: String
          }
        `,
      }),
    });

    const url = new URL('http://yoga/graphql');
    const eventStreamRequest = await yoga.fetch(url, {
      method: 'GET',
      headers: {
        'x-graphql-event-stream-token': 'my-token',
        accept: 'text/event-stream',
      },
      signal: abortController.signal,
    });

    const iterator = eventStreamRequest.body![Symbol.asyncIterator]();
    let next = await iterator.next();
    expect(Buffer.from(next.value).toString('utf-8')).toMatchInlineSnapshot(`
"event: ready

"
`);

    const executeRequest = await yoga.fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        query: `mutation { hello }`,
        extensions: {
          operationId: 'abc',
        },
      }),
      headers: {
        'x-graphql-event-stream-token': 'my-token',
        'content-type': 'application/json',
      },
    });

    expect(executeRequest.status).toEqual(202);
    expect(await executeRequest.text()).toMatchInlineSnapshot(`""`);
    next = await iterator.next();
    expect(Buffer.from(next.value).toString('utf-8')).toMatchInlineSnapshot(`
"event: next
id: abc
data: {"id":"abc","payload":{"data":{"hello":null}}}

"
`);
    abortController.abort();
  });

  it('execute subscription', async () => {
    const abortController = new AbortController();
    const yoga = createYoga({
      plugins: [useSSESingleConnection()],
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            hello: String
          }
          type Subscription {
            hello: String
          }
        `,
        resolvers: {
          Subscription: {
            hello: {
              async *subscribe() {
                yield { hello: 'Hello' };
              },
            },
          },
        },
      }),
    });

    const url = new URL('http://yoga/graphql');
    const eventStreamRequest = await yoga.fetch(url, {
      method: 'GET',
      headers: {
        'x-graphql-event-stream-token': 'my-token',
        accept: 'text/event-stream',
      },
      signal: abortController.signal,
    });

    const iterator = eventStreamRequest.body![Symbol.asyncIterator]();
    let next = await iterator.next();
    expect(Buffer.from(next.value).toString('utf-8')).toMatchInlineSnapshot(`
"event: ready

"
`);

    const executionURL = new URL('http://yoga/graphql');
    executionURL.searchParams.set('query', 'subscription { hello }');
    executionURL.searchParams.set('extensions', JSON.stringify({ operationId: 'abc' }));

    const executeRequest = await yoga.fetch(executionURL, {
      method: 'GET',
      headers: {
        'x-graphql-event-stream-token': 'my-token',
      },
    });

    expect(executeRequest.status).toEqual(202);
    expect(await executeRequest.text()).toMatchInlineSnapshot(`""`);
    next = await iterator.next();
    expect(Buffer.from(next.value).toString('utf-8')).toMatchInlineSnapshot(`
"event: next
id: abc
data: {"id":"abc","payload":{"data":{"hello":"Hello"}}}

"
`);
    abortController.abort();
  });

  it('concurrent operations', async () => {
    const d = createDeferred();
    const yoga = createYoga({
      plugins: [useSSESingleConnection()],
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            hello: String
          }

          type Subscription {
            hello: String
          }
        `,
        resolvers: {
          Subscription: {
            hello: {
              async *subscribe() {
                await d.promise;
                yield { hello: 'Hello' };
              },
            },
          },
        },
      }),
    });

    const url = new URL('http://yoga/graphql');
    url.searchParams.set('query', 'subscription { hello }');
    const response1 = await yoga.fetch(url, {
      headers: {
        'X-GraphQL-Event-Stream-Token': 'my-token',
      },
    });
    const response1Iterator = response1.body![Symbol.asyncIterator]();
    const response1First = await response1Iterator.next();
    expect(Buffer.from(response1First.value).toString('utf-8')).toMatchInlineSnapshot(`
":

"
`);
    const response2 = await yoga.fetch(url, {
      headers: {
        'X-GraphQL-Event-Stream-Token': 'my-token',
      },
    });
    const response2Iterator = response2.body![Symbol.asyncIterator]();
    const response2First = await response2Iterator.next();
    expect(Buffer.from(response2First.value).toString('utf-8')).toMatchInlineSnapshot(`
":

"
`);
  });
});

type Deferred<T = void> = {
  resolve: (value: T) => void;
  reject: (value: unknown) => void;
  promise: Promise<T>;
};

function createDeferred<T = void>(): Deferred<T> {
  const d = {} as Deferred<T>;
  d.promise = new Promise<T>((resolve, reject) => {
    d.resolve = resolve;
    d.reject = reject;
  });
  return d;
}
