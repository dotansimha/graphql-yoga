import crypto from 'node:crypto';
import { createSchema, createYoga } from 'graphql-yoga';
import jwt from 'jsonwebtoken';
import { JwtPluginOptions, useJWT } from '@graphql-yoga/plugin-jwt';

describe('jwt', () => {
  it('should throw if no signing key or jwksUri is provided', () => {
    // @ts-expect-error testing invalid options fo JS users
    expect(() => useJWT({ issuer: 'yoga' })).toThrow(
      'You need to provide either a signingKey or a jwksUri',
    );
  });

  it('should throw if both signing key and jwksUri are provided', () => {
    expect(() =>
      // @ts-expect-error testing invalid options fo JS users
      useJWT({ signingKey: 'test', jwksUri: 'test', issuer: 'yoga' }),
    ).toThrow('You need to provide either a signingKey or a jwksUri, not both');
  });

  it('should throw on unsupported header type', async () => {
    const server = createTestServer();

    const response = await server.queryWithAuth('Basic 123');
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      errors: [
        {
          message: 'Unsupported token type provided: "Basic"',
        },
      ],
    });
  });

  it('should throw on invalid token', async () => {
    const server = createTestServer();

    const response = await server.queryWithAuth('Bearer abcd');
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      errors: [
        {
          message: 'Failed to decode authentication token. Verification failed.',
        },
      ],
    });
  });

  it('should not accept token without algorithm', async () => {
    const server = createTestServer();

    const response = await server.queryWithAuth(buildJWTWithoutAlg());
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      errors: [
        {
          message: 'Failed to decode authentication token. Verification failed.',
        },
      ],
    });
  });

  it('should not allow non matching issuer', async () => {
    const server = createTestServer();

    const response = await server.queryWithAuth(buildJWT({ iss: 'test' }));
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      errors: [
        {
          message: 'Failed to decode authentication token. Verification failed.',
        },
      ],
    });
  });

  it('should not allow non matching audience', async () => {
    const server = createTestServer({ audience: 'test' });

    const response = await server.queryWithAuth(buildJWT({ aud: 'wrong' }));
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      errors: [
        {
          message: 'Failed to decode authentication token. Verification failed.',
        },
      ],
    });
  });

  it('should verify token against provided jwsk', async () => {
    const server = createTestServer({ signingKey: undefined, jwksUri: 'test' });

    const response = await server.queryWithAuth(buildJWT({}, { keyid: 'yoga' }));

    expect(response.status).toBe(200);
  });

  it('should not allow unknown key id', async () => {
    const server = createTestServer({ signingKey: undefined, jwksUri: 'test' });

    const response = await server.queryWithAuth(buildJWT({}, { keyid: 'unknown' }));
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      errors: [
        {
          message: 'Failed to decode authentication token. Unknown key id.',
        },
      ],
    });
  });

  it('should give access to the jwt payload in the context', async () => {
    const server = createTestServer();

    const response = await server.queryWithAuth(buildJWT({ claims: { test: 'test' } }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: {
        ctx: {
          jwt: {
            iss: 'http://yoga',
            claims: {
              test: 'test',
            },
          },
        },
      },
    });
  });

  it('should allow to customize the constructor', async () => {
    const server = createTestServer({ extendContextField: 'custom' });

    const response = await server.queryWithAuth(buildJWT({ claims: { test: 'test' } }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: {
        ctx: {
          custom: {
            iss: 'http://yoga',
          },
        },
      },
    });
  });

  it('should allow to get token from something else than headers', async () => {
    const server = createTestServer({
      getToken: () => buildJWT({}).split(' ')[1],
    });

    const response = await server.queryWithAuth('');
    expect(response.status).toBe(200);
  });
});

const createTestServer = (options?: Partial<JwtPluginOptions>) => {
  const yoga = createYoga({
    schema,
    plugins: [
      // @ts-expect-error testing invalid options fo JS users
      useJWT({
        issuer: 'http://yoga',
        signingKey: 'very secret key',
        algorithms: ['HS256'],
        ...options,
      }),
    ],
  });

  return {
    yoga,
    queryWithAuth: (authorization: string) =>
      yoga.fetch('http://yoga/graphql', {
        method: 'POST',
        body,
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          authorization,
        },
      }),
  };
};

const schema = createSchema({
  typeDefs: /* GraphQL */ `
    scalar JSON
    type Query {
      ctx: JSON
    }
  `,
  resolvers: {
    Query: {
      ctx: (_, __, ctx) => ctx,
    },
  },
});

const body = JSON.stringify({
  query: /* GraphQL */ `
    query {
      ctx
    }
  `,
});

const buildJWT = (
  payload: object,
  options: Parameters<typeof jwt.sign>[2] & { key?: string } = {},
) => {
  const { key = 'very secret key', ...signOptions } = options;

  const token = jwt.sign({ iss: 'http://yoga', ...payload }, key, signOptions);

  return `Bearer ${token}`;
};

function buildJWTWithoutAlg(payload: object = {}, key = 'very secret key') {
  const header = Buffer.from(JSON.stringify({ typ: 'JWT' })).toString('base64');
  const encodedPayload = Buffer.from(JSON.stringify({ iss: 'http://yoga', ...payload })).toString(
    'base64',
  );
  const encodedJWT = `${header}.${encodedPayload}`;
  const signature = crypto.createHmac('sha256', key).update(encodedJWT).digest('base64');
  return `Bearer ${encodedJWT}.${signature}`;
}

jest.mock('jwks-rsa', () => ({
  JwksClient: jest.fn(() => ({
    getSigningKey: jest.fn((kid: string) => {
      if (kid !== 'yoga') {
        return null;
      }
      return { getPublicKey: () => 'very secret key' };
    }),
  })),
}));
