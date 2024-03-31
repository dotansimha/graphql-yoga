import { isAsyncIterable } from '@graphql-tools/utils';
import { processRegularResult } from '../src/plugins/result-processor/regular';
import { createSchema } from '../src/schema';
import { createYoga } from '../src/server';

describe('Custom Result Processor', () => {
  it('supports custom media types', async () => {
    const customMediaType = 'application/custom+json';
    const yoga = createYoga({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            hello: String!
          }
        `,
        resolvers: {
          Query: {
            hello: () => 'Hello World',
          },
        },
      }),
      plugins: [
        {
          onResultProcess({ request, result, setResultProcessor }) {
            const acceptHeader = request.headers.get('accept');
            if (acceptHeader?.includes(customMediaType) && !isAsyncIterable(result)) {
              setResultProcessor(processRegularResult, customMediaType);
            }
          },
        },
      ],
    });
    const res = await yoga.fetch('/graphql', {
      method: 'POST',
      headers: {
        accept: customMediaType,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{ hello }' }),
    });
    const contentTypeHeader = res.headers.get('content-type');
    expect(contentTypeHeader).toBe(`${customMediaType}; charset=utf-8`);
    const json = await res.json();
    expect(json).toEqual({ data: { hello: 'Hello World' } });
  });
});
