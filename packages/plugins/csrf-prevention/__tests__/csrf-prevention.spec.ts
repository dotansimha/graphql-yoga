import { createSchema, createYoga } from 'graphql-yoga';
import { useCSRFPrevention } from '../src/index.js';

describe('csrf-prevention', () => {
  const schema = createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        hello: String!
      }
    `,
    resolvers: {
      Query: {
        hello() {
          return 'world';
        },
      },
    },
  });

  const yoga = createYoga({
    schema,
    plugins: [
      useCSRFPrevention({
        requestHeaders: ['x-graphql-yoga-csrf', 'x-some-other-required'],
      }),
    ],
    maskedErrors: false,
  });

  it('should not allow requests without the necessary header', async () => {
    const res = await yoga.fetch('http://yoga/graphql?query={hello}', {
      'x-not-the-required': 'header',
    });

    expect(res.status).toBe(403);
  });

  it('should allow requests with the necessary header', async () => {
    let res = await yoga.fetch('http://yoga/graphql?query={hello}', {
      headers: {
        'x-graphql-yoga-csrf': 'whatevs',
      },
    });
    expect(res.status).toBe(200);
    await expect(res.text()).resolves.toMatchInlineSnapshot(`"{"data":{"hello":"world"}}"`);

    res = await yoga.fetch('http://yoga/graphql?query={hello}', {
      headers: {
        'x-some-other-required': 'whatevs',
      },
    });
    expect(res.status).toBe(200);
    await expect(res.text()).resolves.toMatchInlineSnapshot(`"{"data":{"hello":"world"}}"`);
  });

  it('should allow all POST requests', async () => {
    const res = await yoga.fetch('http://yoga/graphql?query={hello}', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        query: '{ hello }',
      }),
    });
    expect(res.status).toBe(200);
    await expect(res.text()).resolves.toMatchInlineSnapshot(`"{"data":{"hello":"world"}}"`);
  });
});
