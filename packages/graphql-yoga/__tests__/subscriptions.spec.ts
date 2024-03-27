import { GraphQLError } from 'graphql';
import { createSchema, createYoga, maskError, Plugin } from '../src/index.js';
import { eventStream } from './utilities.js';

describe('Subscription', () => {
  test('eventStream', async () => {
    const source = (async function* foo() {
      yield { hi: 'hi' };
      yield { hi: 'hello' };
      yield { hi: 'bonjour' };
    })();

    const schema = createSchema({
      typeDefs: /* GraphQL */ `
        type Subscription {
          hi: String!
        }
        type Query {
          hi: String!
        }
      `,
      resolvers: {
        Subscription: {
          hi: {
            subscribe: () => source,
          },
        },
      },
    });

    const yoga = createYoga({ schema });

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'text/event-stream',
      },
      body: JSON.stringify({
        query: /* GraphQL */ `
          subscription {
            hi
          }
        `,
      }),
    });

    let counter = 0;

    for await (const chunk of eventStream(response.body!)) {
      if (counter === 0) {
        expect(chunk).toEqual({ data: { hi: 'hi' } });
        counter++;
      } else if (counter === 1) {
        expect(chunk).toEqual({ data: { hi: 'hello' } });
        counter++;
      } else if (counter === 2) {
        expect(chunk).toEqual({ data: { hi: 'bonjour' } });
        counter++;
      }
    }

    if (counter !== 3) {
      throw new Error('Did not receive all events');
    }
  });

  test('should issue pings while connected', async () => {
    const d = createDeferred();

    const schema = createSchema({
      typeDefs: /* GraphQL */ `
        type Subscription {
          hi: String!
        }
        type Query {
          hi: String!
        }
      `,
      resolvers: {
        Subscription: {
          hi: {
            async *subscribe() {
              await d.promise;
              yield { hi: 'hi' };
            },
          },
        },
      },
    });

    const yoga = createYoga({ schema });

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'text/event-stream',
      },
      body: JSON.stringify({
        query: /* GraphQL */ `
          subscription {
            hi
          }
        `,
      }),
    });

    const iterator = response.body![Symbol.asyncIterator]();

    const results = [];
    let value: Uint8Array;

    while (({ value } = await iterator.next())) {
      if (value === undefined) {
        break;
      }
      results.push(Buffer.from(value).toString('utf-8'));
      if (results.length === 3) {
        d.resolve();
      }
    }

    expect(results).toMatchInlineSnapshot(`
[
  ":

",
  ":

",
  ":

",
  "event: next
data: {"data":{"hi":"hi"}}

",
  "event: complete
data:

",
]
`);
  });

  test('should issue pings event if event source never publishes anything', async () => {
    const d = createDeferred();
    const source: AsyncIterableIterator<unknown> = {
      next: () => d.promise.then(() => ({ done: true, value: undefined })),
      return: () => {
        d.resolve();
        return Promise.resolve({ done: true, value: undefined });
      },
      throw: () => {
        throw new Error('Method not implemented. (throw)');
      },
      [Symbol.asyncIterator]() {
        return this;
      },
    };

    const schema = createSchema({
      typeDefs: /* GraphQL */ `
        type Subscription {
          hi: String!
        }
        type Query {
          hi: String!
        }
      `,
      resolvers: {
        Subscription: {
          hi: {
            subscribe: () => source,
          },
        },
      },
    });

    const yoga = createYoga({ schema });

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'text/event-stream',
      },
      body: JSON.stringify({
        query: /* GraphQL */ `
          subscription {
            hi
          }
        `,
      }),
    });

    const iterator = response.body![Symbol.asyncIterator]();

    const results = [];
    let value: Uint8Array;

    while (({ value } = await iterator.next())) {
      if (value === undefined) {
        break;
      }
      results.push(Buffer.from(value).toString('utf-8'));
      if (results.length === 4) {
        await iterator.return!();
      }
    }

    await d.promise;
    expect(results).toMatchInlineSnapshot(`
      [
        ":

      ",
        ":

      ",
        ":

      ",
        ":

      ",
      ]
    `);
  });

  test('erroring event stream should be handled (non GraphQL error)', async () => {
    const schema = createSchema({
      typeDefs: /* GraphQL */ `
        type Subscription {
          hi: String!
        }
        type Query {
          hi: String!
        }
      `,
      resolvers: {
        Subscription: {
          hi: {
            async *subscribe() {
              yield { hi: 'hi' };
              throw new Error('hi');
            },
          },
        },
      },
    });

    const logging = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const yoga = createYoga({ schema, logging });
    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'text/event-stream',
      },
      body: JSON.stringify({
        query: /* GraphQL */ `
          subscription {
            hi
          }
        `,
      }),
    });
    const text = await response.text();

    expect(text).toMatchInlineSnapshot(`
":

event: next
data: {"data":{"hi":"hi"}}

event: next
data: {"errors":[{"message":"Unexpected error.","locations":[{"line":2,"column":11}]}]}

event: complete
data:

"
`);

    expect(logging.error).toBeCalledTimes(1);
    expect(logging.error.mock.calls[0]).toMatchInlineSnapshot(`
      [
        [GraphQLError: hi],
      ]
    `);
  });

  test('erroring event stream should be handled (non GraphQL error; disabled error masking)', async () => {
    const schema = createSchema({
      typeDefs: /* GraphQL */ `
        type Subscription {
          hi: String!
        }
        type Query {
          hi: String!
        }
      `,
      resolvers: {
        Subscription: {
          hi: {
            async *subscribe() {
              yield { hi: 'hi' };
              throw new Error('hi');
            },
          },
        },
      },
    });

    const logging = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const yoga = createYoga({ schema, logging, maskedErrors: false });
    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'text/event-stream',
      },
      body: JSON.stringify({
        query: /* GraphQL */ `
          subscription {
            hi
          }
        `,
      }),
    });
    const text = await response.text();

    expect(text).toMatchInlineSnapshot(`
":

event: next
data: {"data":{"hi":"hi"}}

event: next
data: {"errors":[{"message":"hi","locations":[{"line":2,"column":11}]}]}

event: complete
data:

"
`);
    // errors are only logged when error masking is enabled
    expect(logging.error).toBeCalledTimes(0);
  });

  test('erroring event stream should be handled (GraphQL error)', async () => {
    const schema = createSchema({
      typeDefs: /* GraphQL */ `
        type Subscription {
          hi: String!
        }
        type Query {
          hi: String!
        }
      `,
      resolvers: {
        Subscription: {
          hi: {
            async *subscribe() {
              yield { hi: 'hi' };
              throw new GraphQLError('hi');
            },
          },
        },
      },
    });

    const logging = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const yoga = createYoga({ schema, logging });
    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'text/event-stream',
      },
      body: JSON.stringify({
        query: /* GraphQL */ `
          subscription {
            hi
          }
        `,
      }),
    });
    const text = await response.text();

    expect(text).toMatchInlineSnapshot(`
":

event: next
data: {"data":{"hi":"hi"}}

event: next
data: {"errors":[{"message":"hi","locations":[{"line":2,"column":11}]}]}

event: complete
data:

"
`);

    expect(logging.error).toBeCalledTimes(0);
  });
});

describe('subscription plugin hooks', () => {
  test('onNext and onEnd is invoked for event source', async () => {
    const source = (async function* foo() {
      yield { hi: 'hi' };
      yield { hi: 'hello' };
    })();

    const schema = createSchema({
      typeDefs: /* GraphQL */ `
        type Subscription {
          hi: String!
        }
        type Query {
          hi: String!
        }
      `,
      resolvers: {
        Subscription: {
          hi: {
            subscribe: () => source,
          },
        },
      },
    });

    const onNextCalls: unknown[] = [];
    let didInvokeOnEnd = false;

    const plugin: Plugin = {
      onSubscribe() {
        return {
          onSubscribeResult() {
            return {
              onNext(ctx) {
                onNextCalls.push(ctx.result);
              },
              onEnd() {
                expect(onNextCalls).toHaveLength(2);
                didInvokeOnEnd = true;
              },
            };
          },
        };
      },
    };

    const yoga = createYoga({ schema, plugins: [plugin] });

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'text/event-stream',
      },
      body: JSON.stringify({
        query: /* GraphQL */ `
          subscription {
            hi
          }
        `,
      }),
    });

    let counter = 0;

    for await (const chunk of eventStream(response.body!)) {
      if (counter === 0) {
        expect(chunk).toEqual({ data: { hi: 'hi' } });
        counter++;
      } else if (counter === 1) {
        expect(chunk).toEqual({ data: { hi: 'hello' } });
        counter++;
      }
    }

    expect(counter).toBe(2);
    expect(onNextCalls).toEqual([{ data: { hi: 'hi' } }, { data: { hi: 'hello' } }]);
    expect(didInvokeOnEnd).toBe(true);
  });

  test('onSubscribeError and onEnd is invoked if error is thrown from event source', async () => {
    const source = (async function* foo() {
      yield { hi: 'hi' };
      throw new GraphQLError('hi');
    })();

    const schema = createSchema({
      typeDefs: /* GraphQL */ `
        type Subscription {
          hi: String!
        }
        type Query {
          hi: String!
        }
      `,
      resolvers: {
        Subscription: {
          hi: {
            subscribe: () => source,
          },
        },
      },
    });

    let onNextCallCounter = 0;
    let didInvokeOnEnd = false;
    let didInvokeOnSubscribeError = false;

    const plugin: Plugin = {
      onSubscribe() {
        return {
          onSubscribeError() {
            didInvokeOnSubscribeError = true;
          },
          onSubscribeResult() {
            return {
              onNext() {
                onNextCallCounter++;
              },
              onEnd() {
                expect(onNextCallCounter).toEqual(1);
                didInvokeOnEnd = true;
              },
            };
          },
        };
      },
    };

    const maskErrorFn = jest.fn(maskError);
    const yoga = createYoga({
      schema,
      plugins: [plugin],
      maskedErrors: { maskError: maskErrorFn },
    });

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'text/event-stream',
      },
      body: JSON.stringify({
        query: /* GraphQL */ `
          subscription {
            hi
          }
        `,
      }),
    });

    let counter = 0;

    for await (const chunk of eventStream(response.body!)) {
      if (counter === 0) {
        expect(chunk).toEqual({ data: { hi: 'hi' } });
        counter++;
      } else if (counter === 1) {
        expect(chunk).toMatchObject({ errors: [{ message: 'hi' }] });
        counter++;
      }
    }

    expect(counter).toBe(2);
    expect(onNextCallCounter).toEqual(1);
    expect(didInvokeOnEnd).toBe(true);
    expect(didInvokeOnSubscribeError).toBe(true);
    expect(maskErrorFn).toBeCalledTimes(1);
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
