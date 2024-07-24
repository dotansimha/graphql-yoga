import { createSchema, createYoga } from 'graphql-yoga';
import { useSofa } from '@graphql-yoga/plugin-sofa';

describe('SOFA Plugin', () => {
  it('has the request in the context', async () => {
    const yoga = createYoga<{ _: string }>({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            hello: String!
          }
        `,
        resolvers: {
          Query: {
            hello(_root, _args, context) {
              return `Hello, ${context.request.headers.get('user-agent')}`;
            },
          },
        },
      }),
      plugins: [
        useSofa({
          basePath: '/api',
        }),
      ],
    });
    const res = await yoga.fetch('/api/hello', {
      headers: {
        'user-agent': 'test',
      },
    });
    await expect(res.text()).resolves.toEqual('"Hello, test"');
  });
});
