import { Plugin } from '../src/plugins/types';
import { createSchema } from '../src/schema';
import { createYoga } from '../src/server';

it('supports custom JSON serializer', async () => {
  const useCustomSerializer: Plugin = {
    onExecute({ setExecuteFn }) {
      setExecuteFn(() => ({
        stringify: () =>
          JSON.stringify({
            data: {
              hello: 'world',
            },
          }),
      }));
    },
  };
  const yoga = createYoga({
    schema: createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          hello: String!
        }
      `,
    }),
    plugins: [useCustomSerializer],
  });
  const res = await yoga.fetch('/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: /* GraphQL */ `
        query {
          hello
        }
      `,
    }),
  });

  const resJson = await res.json();
  expect(resJson).toMatchObject({
    data: {
      hello: 'world',
    },
  });
});
