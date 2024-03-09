import { createSchema, createYoga } from '../src/index';

describe('request cancellation', () => {
  it('request cancellation stops invocation of subsequent resolvers', async () => {
    const rootResolverGotInvokedD = createDeferred();
    const requestGotCancelledD = createDeferred();

    let aResolverGotInvoked = false;
    let rootResolverGotInvoked = false;

    const schema = createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          root: A!
        }

        type A {
          a: String!
        }
      `,
      resolvers: {
        Query: {
          async root() {
            rootResolverGotInvoked = true;
            rootResolverGotInvokedD.resolve();
            await requestGotCancelledD.promise;

            return { a: 'a' };
          },
        },
        A: {
          a() {
            aResolverGotInvoked = true;
            return 'a';
          },
        },
      },
    });

    const yoga = createYoga({ schema });

    const abortController = new AbortController();
    const promise = Promise.resolve(
      yoga.fetch('http://yoga/graphql', {
        method: 'POST',
        body: JSON.stringify({ query: '{ root { a } }' }),
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortController.signal,
      }),
    );

    await rootResolverGotInvokedD.promise;
    abortController.abort();

    requestGotCancelledD.resolve();

    // The request was aborted, so the promise should raise instead
    const result = await promise.then(res => res.text());
    // why does this return a (invalid) GraphQL response?
    expect(result).toMatchInlineSnapshot(`"{"data":{"root":{"a":null}}}"`);

    expect(rootResolverGotInvoked).toBe(true);
    expect(aResolverGotInvoked).toBe(false);
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
