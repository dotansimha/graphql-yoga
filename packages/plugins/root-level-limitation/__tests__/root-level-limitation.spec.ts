import { createSchema, createYoga } from 'graphql-yoga';
import { rootLevelQueryLimit } from '../src/index.js';

describe('root-level-limitation', () => {
  const schema = createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        topProducts: GetTopProducts
        topBooks: GetTopBooks
      }
      type GetTopBooks {
        id: Int
      }
      type GetTopProducts {
        id: Int
      }
    `,
  });

  const yoga = createYoga({
    schema,
    plugins: [rootLevelQueryLimit({ maxRootLevelFields: 1 })],
    maskedErrors: false,
  });

  it('should not allow requests with max root level query', async () => {
    const res = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      body: JSON.stringify({
        query: /* GraphQL */ `
          {
            topBooks {
              id
            }
            topProducts {
              id
            }
          }
        `,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(res.status).toBe(400);
  });

  it('should allow requests with max root level query', async () => {
    const res = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      body: JSON.stringify({
        query: /* GraphQL */ `
          {
            topProducts {
              id
            }
          }
        `,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(res.status).toBe(200);
  });
});
