import { inspect } from '@graphql-tools/utils';
import { createGraphQLError, createSchema, createYoga } from '../src/index.js';
import { eventStream } from './utilities.js';

describe('error masking', () => {
  function createTestSchema() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createSchema<any>({
      typeDefs: /* GraphQL */ `
        type Query {
          hello: String
          hi: String
        }
      `,
      resolvers: {
        Query: {
          hello: () => {
            throw createGraphQLError('This error never gets masked.');
          },
          hi: () => {
            throw new Error('This error will get mask if you enable maskedError.');
          },
        },
      },
    });
  }

  it('masks non GraphQLError instances', async () => {
    const yoga = createYoga({
      schema: createTestSchema(),
      maskedErrors: true,
      logging: false,
    });

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ hi hello }' }),
    });

    const body = await response.json();
    expect(body.data.hi).toBeNull();
    expect(body.errors![0].message).toBe('Unexpected error.');
    expect(body.data.hello).toBeNull();
    expect(body.errors![1].message).toBe('This error never gets masked.');
  });

  it('mask error with custom message', async () => {
    const yoga = createYoga({
      schema: createTestSchema(),
      maskedErrors: { errorMessage: 'Hahahaha' },
      logging: false,
    });

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ hi hello }' }),
    });
    const body = await response.json();

    expect(body.data.hi).toBeNull();
    expect(body.errors![0].message).toBe('Hahahaha');
    expect(body.data.hello).toBeNull();
    expect(body.errors![1].message).toBe('This error never gets masked.');
  });

  it('masks non GraphQLError instances by default (no config option)', async () => {
    const yoga = createYoga({
      schema: createTestSchema(),
      logging: false,
    });

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ hi hello }' }),
    });

    const body = await response.json();
    expect(body.data.hi).toBeNull();
    expect(body.errors![0].message).toBe('Unexpected error.');
    expect(body.data.hello).toBeNull();
    expect(body.errors![1].message).toBe('This error never gets masked.');
  });

  it('includes the original error in the extensions in dev mode', async () => {
    const yoga = createYoga({
      schema: createTestSchema(),
      logging: false,
      maskedErrors: {
        isDev: true,
      },
    });

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ hi hello }' }),
    });

    const body = await response.json();
    expect(body.data.hi).toBeNull();
    expect(body.errors?.[0]?.message).toBe('Unexpected error.');
    expect(body.errors?.[0]?.extensions?.originalError?.message).toBe(
      'This error will get mask if you enable maskedError.',
    );
    expect(body.errors?.[0]?.extensions?.originalError?.stack).toContain(
      'Error: This error will get mask if you enable maskedError.',
    );
  });

  it('includes the original error in the extensions in dev mode (process.env.NODE_ENV=development)', async () => {
    const initialEnv = process.env.NODE_ENV;

    try {
      process.env.NODE_ENV = 'development';

      const yoga = createYoga({
        schema: createTestSchema(),
        logging: false,
      });

      const response = await yoga.fetch('http://yoga/graphql', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: '{ hi hello }' }),
      });

      const body = await response.json();
      expect(body.data.hi).toBeNull();
      expect(body.errors?.[0]?.message).toBe('Unexpected error.');
      expect(body.errors?.[0]?.extensions?.originalError?.message).toBe(
        'This error will get mask if you enable maskedError.',
      );
      expect(body.errors?.[0]?.extensions?.originalError?.stack).toContain(
        'Error: This error will get mask if you enable maskedError.',
      );
    } finally {
      process.env.NODE_ENV = initialEnv;
    }
  });

  it('non GraphQLError raised in onRequestParse is masked with the correct status code 500', async () => {
    const yoga = createYoga({
      schema: createTestSchema(),
      plugins: [
        {
          onRequestParse() {
            throw new Error('Some random error!');
          },
        },
      ],
      logging: false,
    });

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        accept: 'application/graphql-response+json',
      },
      body: JSON.stringify({ query: '{ hi hello }' }),
    });

    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body.errors?.[0]?.message).toBe('Unexpected error.');
  });

  it('error thrown within context factory without error masking is not swallowed and does not include stack trace', async () => {
    const yoga = createYoga({
      logging: false,
      maskedErrors: false,
      context: () => {
        throw new Error('I like turtles');
      },
      schema: createTestSchema(),
    });

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ __typename }' }),
    });
    const body = await response.json();
    expect(body).toMatchObject({
      errors: [
        {
          message: 'I like turtles',
        },
      ],
    });
  });

  it('error thrown within context factory is masked', async () => {
    const yoga = createYoga({
      logging: false,
      context: () => {
        throw new Error('I like turtles');
      },
      schema: createTestSchema(),
    });

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ __typename }' }),
    });
    const body = await response.json();
    expect(body).toMatchObject({
      errors: [
        {
          message: 'Unexpected error.',
        },
      ],
    });
  });

  it('GraphQLError thrown within context factory with error masking is not masked', async () => {
    const yoga = createYoga({
      logging: false,
      context: () => {
        throw createGraphQLError('I like turtles');
      },
      schema: createTestSchema(),
    });

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ __typename }' }),
    });
    const body = await response.json();
    expect(body).toMatchObject({
      errors: [
        {
          message: 'I like turtles',
        },
      ],
    });
  });

  it('GraphQLError thrown within context factory has error extensions exposed on the response', async () => {
    const yoga = createYoga({
      logging: false,
      context: () => {
        throw createGraphQLError('I like turtles', {
          extensions: {
            foo: 1,
          },
        });
      },
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            greetings: String
          }
        `,
      }),
    });

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ greetings }' }),
    });
    const body = await response.json();
    expect(body).toMatchObject({
      errors: [
        {
          extensions: {
            foo: 1,
          },
          message: 'I like turtles',
        },
      ],
    });
  });

  it('parse error is not masked', async () => {
    const yoga = createYoga({
      logging: false,
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            a: String!
          }
        `,
      }),
    });

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        accept: 'application/graphql-response+json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{libl_pls' }),
    });

    expect(response.status).toEqual(400);
    const body = await response.json();

    expect(body).toMatchObject({
      errors: [
        {
          locations: [
            {
              column: 10,
              line: 1,
            },
          ],
          message: 'Syntax Error: Expected Name, found <EOF>.',
        },
      ],
    });
  });

  it('validation error is not masked', async () => {
    const yoga = createYoga({
      logging: false,
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            a: String!
          }
        `,
      }),
    });

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        accept: 'application/graphql-response+json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{libl_pls}' }),
    });

    expect(response.status).toEqual(400);
    const body = await response.json();

    expect(body).toMatchObject({
      errors: [
        {
          locations: [
            {
              column: 2,
              line: 1,
            },
          ],
          message: 'Cannot query field "libl_pls" on type "Query".',
        },
      ],
    });
  });

  it('error thrown within context factory is exposed via originalError extension field in dev mode', async () => {
    const yoga = createYoga({
      logging: false,
      context: () => {
        throw new Error('I am the original error.');
      },
      maskedErrors: {
        isDev: true,
      },
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            a: String!
          }
        `,
      }),
    });
    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{a}' }),
    });

    const body = await response.json();
    expect(body.errors[0].message).toEqual('Unexpected error.');
    expect(body.errors[0].extensions.originalError.message).toEqual('I am the original error.');
    expect(body.errors[0].extensions.originalError.stack).toContain(
      'Error: I am the original error.',
    );
  });

  it('masked errors from context factory should return 500 status code', async () => {
    const yoga = createYoga({
      logging: false,
      context: () => {
        throw new Error('I like turtles');
      },
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            a: String!
          }
        `,
      }),
    });

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        accept: 'application/graphql-response+json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{ __typename }' }),
    });
    expect(response.status).toEqual(500);
    expect(await response.json()).toMatchObject({
      errors: [
        {
          message: 'Unexpected error.',
        },
      ],
    });
  });

  it('call the custom maskError function with correct parameters', async () => {
    const yoga = createYoga({
      logging: false,
      context: () => {
        throw new Error('I like turtles');
      },
      maskedErrors: {
        errorMessage: 'My message',
        maskError: (error, message, isDev) => {
          return createGraphQLError(
            inspect({
              errorStr: String(error),
              message,
              isDev,
            }),
          );
        },
        isDev: true,
      },
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            a: String!
          }
        `,
      }),
    });

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{ __typename }' }),
    });
    expect(await response.json()).toMatchObject({
      errors: [
        {
          message: '{ errorStr: "Error: I like turtles", message: "My message", isDev: true }',
        },
      ],
    });
  });

  it('support errors with undefined extensions', async () => {
    const yoga = createYoga({
      logging: false,
      context: () => {
        const error = createGraphQLError('I like turtles');
        Object.defineProperty(error, 'extensions', {
          get() {
            return undefined;
          },
        });
        throw error;
      },
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            a: String!
          }
        `,
      }),
    });

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{ __typename }' }),
    });
    expect(await response.json()).toMatchObject({
      errors: [
        {
          message: 'I like turtles',
        },
      ],
    });
  });

  it('subscription event source error is masked', async () => {
    const eventSouce = (async function* source() {
      yield { hi: 'hi' };
      throw new Error('I like turtles');
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
            subscribe: () => eventSouce,
          },
        },
      },
    });

    const yoga = createYoga({ schema, logging: false });

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
        continue;
      } else if (counter === 1) {
        expect(chunk).toMatchObject({ errors: [{ message: 'Unexpected error.' }] });
        counter++;
        continue;
      }

      throw new Error('Should not have received more than 2 chunks.');
    }

    expect(counter).toBe(2);
  });

  it('subscription event source creation error is masked', async () => {
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
            subscribe: () => {
              throw new Error('I like turtles');
            },
          },
        },
      },
    });

    const yoga = createYoga({ schema, logging: false });

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
        expect(chunk).toMatchObject({ errors: [{ message: 'Unexpected error.', path: ['hi'] }] });
        counter++;
        continue;
      }

      throw new Error('Should not have received more than 2 chunks.');
    }

    expect(counter).toBe(1);
  });

  it('subscription field resolve error is masked', async () => {
    const eventSource = (async function* source() {
      yield 1;
      yield 2;
      yield 3;
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
            subscribe: () => eventSource,
            resolve: data => {
              if (data === 1) {
                return 'hee';
              }
              if (data === 2) {
                throw new Error('I like turtles');
              }
              if (data === 3) {
                return 'hoo';
              }
              throw new Error('This shall never be reached');
            },
          },
        },
      },
    });

    const yoga = createYoga({ schema, logging: false });

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
        expect(chunk).toMatchObject({ data: { hi: 'hee' } });
        counter++;
        continue;
      }
      if (counter === 1) {
        expect(chunk).toMatchObject({ errors: [{ message: 'Unexpected error.', path: ['hi'] }] });
        counter++;
        continue;
      }
      if (counter === 2) {
        expect(chunk).toMatchObject({ data: { hi: 'hoo' } });
        counter++;
        continue;
      }

      throw new Error('Should not have received more than 3 chunks.');
    }

    expect(counter).toBe(3);
  });
});
