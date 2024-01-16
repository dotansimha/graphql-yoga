import { createSchema, createYoga, YogaServerInstance } from 'graphql-yoga';
import { cacheControlDirective, ShouldCacheResultFunction } from '@envelop/response-cache';
import { useDeferStream } from '@graphql-yoga/plugin-defer-stream';
import { createInMemoryCache, useResponseCache } from '@graphql-yoga/plugin-response-cache';

const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Query {
      _: String
    }
  `,
  resolvers: {
    Query: {
      _: () => 'DUMMY',
    },
  },
});

it('should not hit GraphQL pipeline if cached', async () => {
  const onEnveloped = jest.fn();
  const yoga = createYoga({
    schema,
    plugins: [
      useResponseCache({
        session: () => null,
        includeExtensionMetadata: true,
      }),
      {
        onEnveloped,
      },
    ],
  });
  const response = await yoga.fetch('http://localhost:3000/graphql', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ query: '{ _ }' }),
  });

  expect(response.status).toEqual(200);
  const body = await response.json();
  expect(body).toEqual({
    data: {
      _: 'DUMMY',
    },
    extensions: {
      responseCache: {
        didCache: true,
        hit: false,
        ttl: null,
      },
    },
  });
  const response2 = await yoga.fetch('http://localhost:3000/graphql', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ query: '{ _ }' }),
  });
  const body2 = await response2.json();
  expect(body2).toMatchObject({
    data: {
      _: 'DUMMY',
    },
    extensions: {
      responseCache: {
        hit: true,
      },
    },
  });
  expect(onEnveloped).toHaveBeenCalledTimes(1);
});

it('cache a query operation', async () => {
  const yoga = createYoga({
    plugins: [
      useResponseCache({
        session: () => null,
        includeExtensionMetadata: true,
      }),
    ],
    schema,
  });
  function fetch() {
    return yoga.fetch('http://localhost:3000/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{__typename}' }),
    });
  }

  let response = await fetch();

  expect(response.status).toEqual(200);
  let body = await response.json();
  expect(body).toEqual({
    data: {
      __typename: 'Query',
    },
    extensions: {
      responseCache: {
        didCache: true,
        hit: false,
        ttl: null,
      },
    },
  });

  response = await fetch();
  expect(response.status).toEqual(200);
  body = await response.json();
  expect(body).toMatchObject({
    data: {
      __typename: 'Query',
    },
    extensions: {
      responseCache: {
        hit: true,
      },
    },
  });
});

it('cache a query operation per session', async () => {
  const yoga = createYoga({
    plugins: [
      useResponseCache({
        session: request => request.headers.get('x-session-id') ?? null,
        includeExtensionMetadata: true,
      }),
    ],
    schema,
  });
  function fetch(sessionId: string) {
    return yoga.fetch('http://localhost:3000/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-session-id': sessionId,
      },
      body: JSON.stringify({ query: '{__typename}' }),
    });
  }

  let response = await fetch('1');

  expect(response.status).toEqual(200);
  let body = await response.json();
  expect(body).toMatchObject({
    data: {
      __typename: 'Query',
    },
    extensions: {
      responseCache: {
        didCache: true,
        hit: false,
        ttl: null,
      },
    },
  });

  response = await fetch('1');
  expect(response.status).toEqual(200);
  body = await response.json();
  expect(body).toMatchObject({
    data: {
      __typename: 'Query',
    },
    extensions: {
      responseCache: {
        hit: true,
      },
    },
  });

  response = await fetch('2');

  expect(response.status).toEqual(200);
  body = await response.json();
  expect(body).toMatchObject({
    data: {
      __typename: 'Query',
    },
    extensions: {
      responseCache: {
        didCache: true,
        hit: false,
        ttl: null,
      },
    },
  });
});

it('should miss cache if query variables change', async () => {
  const yoga = createYoga({
    logging: false,
    schema: createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          hi(person: String!): String!
        }
      `,
      resolvers: {
        Query: {
          hi: (_, args) => `Hi ${args.person}!`,
        },
      },
    }),
    plugins: [
      useResponseCache({
        session: () => 'testing',
      }),
    ],
  });

  const query = (person: string | null) =>
    yoga.fetch('/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        operationName: 'Welcomer',
        query: 'query Welcomer($person: String!) { hi(person: $person) }',
        variables: { person },
      }),
    });

  // first invalid request, will be cached
  let res = await query(null);
  await expect(res.json()).resolves.toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "locations": [
            {
              "column": 16,
              "line": 1,
            },
          ],
          "message": "Variable "$person" of non-null type "String!" must not be null.",
        },
      ],
    }
  `);

  // second invalid request, cache hit
  res = await query(null);
  await expect(res.json()).resolves.toMatchInlineSnapshot(`
    {
      "errors": [
        {
          "locations": [
            {
              "column": 16,
              "line": 1,
            },
          ],
          "message": "Variable "$person" of non-null type "String!" must not be null.",
        },
      ],
    }
  `);

  // third request, valid, cache miss
  res = await query('John');
  expect(await res.json()).toMatchObject({
    data: {
      hi: 'Hi John!',
    },
  });
});

it('should skip response caching with `enabled` option', async () => {
  const hiResolver = jest.fn(() => 'Hi!');
  const yoga = createYoga({
    schema: createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          hi: String!
        }
      `,
      resolvers: {
        Query: {
          hi: hiResolver,
        },
      },
    }),
    plugins: [
      useResponseCache({
        enabled: () => false,
        session: () => null,
      }),
    ],
  });

  const resOptions: RequestInit = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      query: /* GraphQL */ `
        query {
          hi
        }
      `,
    }),
  };

  const res1 = await yoga.fetch('/graphql', resOptions);

  const body1 = await res1.json();
  expect(body1).toMatchObject({
    data: {
      hi: 'Hi!',
    },
  });

  const res2 = await yoga.fetch('/graphql', resOptions);
  const body2 = await res2.json();
  expect(body2).toMatchObject({
    data: {
      hi: 'Hi!',
    },
  });
});

it('should work with @cacheControl directive', async () => {
  const yoga = createYoga({
    schema: createSchema({
      typeDefs: /* GraphQL */ `
        ${cacheControlDirective}

        type Query @cacheControl(maxAge: 0) {
          _: String
        }
      `,
      resolvers: {
        Query: {
          _: () => 'DUMMY',
        },
      },
    }),
    plugins: [
      useResponseCache({
        session: () => null,
        includeExtensionMetadata: true,
      }),
    ],
  });
  function fetch() {
    return yoga.fetch('http://localhost:3000/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{__typename}' }),
    });
  }

  let response = await fetch();

  expect(response.status).toEqual(200);
  let body = await response.json();
  expect(body).toEqual({
    data: {
      __typename: 'Query',
    },
    extensions: {
      responseCache: {
        didCache: false,
        hit: false,
      },
    },
  });

  response = await fetch();
  expect(response.status).toEqual(200);
  body = await response.json();
  expect(body).toMatchObject({
    data: {
      __typename: 'Query',
    },
    extensions: {
      responseCache: {
        hit: false,
      },
    },
  });
});

describe('should support scope', () => {
  it('should not cache response with a type with a PRIVATE scope for request without session', async () => {
    const yoga = createYoga({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          ${cacheControlDirective}

          type Query @cacheControl(scope: PRIVATE) {
            _: String
          }
        `,
        resolvers: {
          Query: {
            _: () => 'DUMMY',
          },
        },
      }),
      plugins: [
        useResponseCache({
          session: () => null,
          includeExtensionMetadata: true,
        }),
      ],
    });
    function fetch() {
      return yoga.fetch('http://localhost:3000/graphql', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ query: '{__typename}' }),
      });
    }

    let response = await fetch();

    expect(response.status).toEqual(200);
    let body = await response.json();
    expect(body).toEqual({
      data: {
        __typename: 'Query',
      },
      extensions: {
        responseCache: {
          didCache: false,
          hit: false,
        },
      },
    });

    response = await fetch();
    expect(response.status).toEqual(200);
    body = await response.json();
    expect(body).toMatchObject({
      data: {
        __typename: 'Query',
      },
      extensions: {
        responseCache: {
          hit: false,
        },
      },
    });
  });

  it('should cache response with a type with a PRIVATE scope for request with session', async () => {
    const yoga = createYoga({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          ${cacheControlDirective}

          type Query @cacheControl(scope: PRIVATE) {
            _: String
          }
        `,
        resolvers: {
          Query: {
            _: () => 'DUMMY',
          },
        },
      }),
      plugins: [
        useResponseCache({
          session: () => 'testing',
          includeExtensionMetadata: true,
        }),
      ],
    });
    function fetch() {
      return yoga.fetch('http://localhost:3000/graphql', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ query: '{__typename}' }),
      });
    }

    let response = await fetch();

    expect(response.status).toEqual(200);
    let body = await response.json();
    expect(body).toEqual({
      data: {
        __typename: 'Query',
      },
      extensions: {
        responseCache: {
          didCache: true,
          hit: false,
          ttl: null,
        },
      },
    });

    response = await fetch();
    expect(response.status).toEqual(200);
    body = await response.json();
    expect(body).toMatchObject({
      data: {
        __typename: 'Query',
      },
      extensions: {
        responseCache: {
          hit: true,
        },
      },
    });
  });

  it('should not cache response with a type with a PRIVATE scope for request without session using options', async () => {
    const yoga = createYoga({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          ${cacheControlDirective}

          type Query {
            _: String
          }
        `,
        resolvers: {
          Query: {
            _: () => 'DUMMY',
          },
        },
      }),
      plugins: [
        useResponseCache({
          session: () => null,
          includeExtensionMetadata: true,
          scopePerSchemaCoordinate: {
            Query: 'PRIVATE',
          },
        }),
      ],
    });
    function fetch() {
      return yoga.fetch('http://localhost:3000/graphql', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ query: '{__typename}' }),
      });
    }

    let response = await fetch();

    expect(response.status).toEqual(200);
    let body = await response.json();
    expect(body).toEqual({
      data: {
        __typename: 'Query',
      },
      extensions: {
        responseCache: {
          didCache: false,
          hit: false,
        },
      },
    });

    response = await fetch();
    expect(response.status).toEqual(200);
    body = await response.json();
    expect(body).toMatchObject({
      data: {
        __typename: 'Query',
      },
      extensions: {
        responseCache: {
          hit: false,
        },
      },
    });
  });

  it('should cache response with a type with a PRIVATE scope for request with session', async () => {
    const yoga = createYoga({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          ${cacheControlDirective}

          type Query {
            _: String
          }
        `,
        resolvers: {
          Query: {
            _: () => 'DUMMY',
          },
        },
      }),
      plugins: [
        useResponseCache({
          session: () => 'testing',
          includeExtensionMetadata: true,
          scopePerSchemaCoordinate: {
            Query: 'PRIVATE',
          },
        }),
      ],
    });
    function fetch() {
      return yoga.fetch('http://localhost:3000/graphql', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ query: '{__typename}' }),
      });
    }

    let response = await fetch();

    expect(response.status).toEqual(200);
    let body = await response.json();
    expect(body).toEqual({
      data: {
        __typename: 'Query',
      },
      extensions: {
        responseCache: {
          didCache: true,
          hit: false,
          ttl: null,
        },
      },
    });

    response = await fetch();
    expect(response.status).toEqual(200);
    body = await response.json();
    expect(body).toMatchObject({
      data: {
        __typename: 'Query',
      },
      extensions: {
        responseCache: {
          hit: true,
        },
      },
    });
  });
});

describe('should support async results', () => {
  it('should cache queries using @stream', async () => {
    const spy = jest.fn(async function* () {
      yield 'first';
      yield 'second';
      await new Promise(process.nextTick);
      yield 'third';
    });

    const yoga = createYoga({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            streaming: [String]!
          }
        `,
        resolvers: {
          Query: {
            streaming: spy,
          },
        },
      }),
      plugins: [
        useDeferStream(),
        useResponseCache({
          session: () => null,
          includeExtensionMetadata: true,
        }),
      ],
    });
    function fetch() {
      return yoga.fetch('http://localhost:3000/graphql', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ query: '{ streaming @stream }' }),
      });
    }

    let response = await fetch();

    expect(response.status).toEqual(200);
    //wait for the response to be complete
    await response.text();

    response = await fetch();
    expect(response.status).toEqual(200);
    const body = await response.json();
    expect(body).toMatchObject({
      data: {
        streaming: ['first', 'second', 'third'],
      },
      extensions: {
        responseCache: {
          hit: true,
        },
      },
    });
  });
  it('should cache queries using @defer', async () => {
    const spy = jest.fn(async function* () {
      yield 'first';
      yield 'second';
      await new Promise(process.nextTick);
      yield 'third';
    });

    const yoga = createYoga({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            streaming: [String]!
          }
        `,
        resolvers: {
          Query: {
            streaming: spy,
          },
        },
      }),
      plugins: [
        useDeferStream(),
        useResponseCache({
          session: () => null,
          includeExtensionMetadata: true,
        }),
      ],
    });
    function fetch() {
      return yoga.fetch('http://localhost:3000/graphql', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          query: '{ ... on Query @defer { streaming } }',
        }),
      });
    }

    let response = await fetch();

    expect(response.status).toEqual(200);
    //wait for the response to be complete
    await response.text();

    response = await fetch();
    expect(response.status).toEqual(200);
    const body = await response.json();
    expect(body).toMatchObject({
      data: {
        streaming: ['first', 'second', 'third'],
      },
      extensions: {
        responseCache: {
          hit: true,
        },
      },
    });
  });
});

it('should allow subscriptions and ignore it', async () => {
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

  const yoga = createYoga({
    schema,
    plugins: [
      useResponseCache({
        session: () => null,
      }),
    ],
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

  const result = await response.text();
  expect(result).toContain(JSON.stringify({ data: { hi: 'hi' } }));
  expect(result).toContain(JSON.stringify({ data: { hi: 'hello' } }));
  expect(result).toContain(JSON.stringify({ data: { hi: 'bonjour' } }));
});

it('should allow to create the cache outside of the plugin', async () => {
  const onEnveloped = jest.fn();
  const yoga = createYoga({
    schema,
    plugins: [
      useResponseCache({
        session: () => null,
        includeExtensionMetadata: true,
        cache: createInMemoryCache(),
      }),
      {
        onEnveloped,
      },
    ],
  });
  const response = await yoga.fetch('http://localhost:3000/graphql', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ query: '{ _ }' }),
  });

  expect(response.status).toEqual(200);
  const body = await response.json();
  expect(body).toEqual({
    data: {
      _: 'DUMMY',
    },
    extensions: {
      responseCache: {
        didCache: true,
        hit: false,
        ttl: null,
      },
    },
  });
  const response2 = await yoga.fetch('http://localhost:3000/graphql', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ query: '{ _ }' }),
  });
  const body2 = await response2.json();
  expect(body2).toMatchObject({
    data: {
      _: 'DUMMY',
    },
    extensions: {
      responseCache: {
        hit: true,
      },
    },
  });
  expect(onEnveloped).toHaveBeenCalledTimes(1);
});

describe('shouldCacheResult', () => {
  // eslint-disable-next-line @typescript-eslint/ban-types
  let yoga: YogaServerInstance<{}, {}>;
  let shouldCacheResultFn: ShouldCacheResultFunction | undefined;
  const logging = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  function fetch(query: string) {
    return yoga.fetch('http://localhost:3000/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });
  }

  function createYogaServer() {
    return createYoga({
      logging,
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          ${cacheControlDirective}

          type Query {
            hello: String
            throws: String
          }
        `,
        resolvers: {
          Query: {
            hello: () => 'world',
            throws: () => {
              throw new Error('DUMMY');
            },
          },
        },
      }),
      plugins: [
        useResponseCache({
          session: () => null,
          shouldCacheResult: shouldCacheResultFn,
          includeExtensionMetadata: true,
        }),
      ],
    });
  }

  const cacheSkip = {
    extensions: {
      responseCache: {
        didCache: false,
        hit: false,
      },
    },
  };

  const cacheSet = {
    extensions: {
      responseCache: {
        didCache: true,
        hit: false,
        ttl: null,
      },
    },
  };

  const cacheHit = {
    extensions: {
      responseCache: {
        hit: true,
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when server returns errors', () => {
    const query = 'query FetchError { throws }';
    const expectedResponsePayload = {
      data: { throws: null },
      errors: expect.arrayContaining([expect.objectContaining({ message: 'Unexpected error.' })]),
    };

    describe('and we have no custom shouldCacheResult function', () => {
      beforeEach(() => {
        shouldCacheResultFn = undefined;
        yoga = createYogaServer();
      });

      it('does not cache the response (default behavior)', async () => {
        const response = await fetch(query);
        let body = await response.json();
        expect(body).toEqual({
          ...expectedResponsePayload,
          ...cacheSkip,
        });

        const cachedResponse = await fetch(query);
        body = await cachedResponse.json();
        expect(body).toEqual({
          ...expectedResponsePayload,
          ...cacheSkip,
        });
        expect(logging.debug).toHaveBeenCalledWith(
          '[useResponseCache] Decided not to cache the response because it contains errors',
        );
      });
    });

    describe('and we want to cache it', () => {
      beforeEach(() => {
        shouldCacheResultFn = jest.fn(() => true);
        yoga = createYogaServer();
      });

      it('caches the error response', async () => {
        const response = await fetch(query);
        let body = await response.json();
        expect(body).toEqual({
          ...expectedResponsePayload,
          ...cacheSet,
        });

        const cachedResponse = await fetch(query);
        body = await cachedResponse.json();
        expect(body).toEqual({
          ...expectedResponsePayload,
          ...cacheHit,
          // NOTE: This actually returns the unmasked error DUMMY instead of the original "Unexpected error."
          errors: expect.arrayContaining([expect.objectContaining({ message: 'DUMMY' })]),
        });
        expect(logging.debug).not.toHaveBeenCalledWith(
          '[useResponseCache] Decided not to cache the response because it contains errors',
        );
      });
    });

    describe('and we do not want to cache it', () => {
      beforeEach(() => {
        shouldCacheResultFn = jest.fn(() => false);
        yoga = createYogaServer();
      });

      it('does not cache the error response', async () => {
        const response = await fetch(query);
        let body = await response.json();
        expect(body).toEqual({
          ...expectedResponsePayload,
          ...cacheSkip,
        });

        const cachedResponse = await fetch(query);
        body = await cachedResponse.json();
        expect(body).toEqual({
          ...expectedResponsePayload,
          ...cacheSkip,
        });
        expect(logging.debug).not.toHaveBeenCalledWith(
          '[useResponseCache] Decided not to cache the response because it contains errors',
        );
      });
    });
  });

  describe('when server returns no error', () => {
    const query = 'query FetchHello { hello }';
    const expectedResponsePayload = {
      data: { hello: 'world' },
    };

    describe('and we have no custom shouldCacheResult function', () => {
      beforeEach(() => {
        shouldCacheResultFn = undefined;
        yoga = createYogaServer();
      });

      it('caches the response (default behavior)', async () => {
        const response = await fetch(query);
        let body = await response.json();
        expect(body).toEqual({
          ...expectedResponsePayload,
          ...cacheSet,
        });

        const cachedResponse = await fetch(query);
        body = await cachedResponse.json();
        expect(body).toEqual({
          ...expectedResponsePayload,
          ...cacheHit,
        });
        expect(logging.debug).not.toHaveBeenCalledWith(
          '[useResponseCache] Decided not to cache the response because it contains errors',
        );
      });
    });

    describe('and we want to cache it', () => {
      beforeEach(() => {
        shouldCacheResultFn = jest.fn(() => true);
        yoga = createYogaServer();
      });

      it('caches the response', async () => {
        const response = await fetch(query);
        let body = await response.json();
        expect(body).toEqual({
          ...expectedResponsePayload,
          ...cacheSet,
        });

        const cachedResponse = await fetch(query);
        body = await cachedResponse.json();
        expect(body).toEqual({
          ...expectedResponsePayload,
          ...cacheHit,
        });
        expect(logging.debug).not.toHaveBeenCalledWith(
          '[useResponseCache] Decided not to cache the response because it contains errors',
        );
      });
    });

    describe('and we do not want to cache it', () => {
      beforeEach(() => {
        shouldCacheResultFn = jest.fn(() => false);
        yoga = createYogaServer();
      });

      it('does not cache the response', async () => {
        const response = await fetch(query);
        let body = await response.json();
        expect(body).toEqual({
          ...expectedResponsePayload,
          ...cacheSkip,
        });

        const cachedResponse = await fetch(query);
        body = await cachedResponse.json();
        expect(body).toEqual({
          ...expectedResponsePayload,
          ...cacheSkip,
        });
        expect(logging.debug).not.toHaveBeenCalledWith(
          '[useResponseCache] Decided not to cache the response because it contains errors',
        );
      });
    });
  });
});

it('response has "servedFromResponseCache" symbol', async () => {
  const results: Array<any> = [];
  const yoga = createYoga({
    plugins: [
      useResponseCache({
        session: () => null,
        includeExtensionMetadata: true,
      }),
      {
        onResultProcess(context) {
          results.push(context.result);
        },
      },
    ],
    schema,
  });
  function fetch() {
    return yoga.fetch('http://localhost:3000/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{__typename}' }),
    });
  }

  let response = await fetch();

  expect(response.status).toEqual(200);
  let body = await response.json();
  expect(body).toEqual({
    data: {
      __typename: 'Query',
    },
    extensions: {
      responseCache: {
        didCache: true,
        hit: false,
        ttl: null,
      },
    },
  });

  response = await fetch();
  expect(response.status).toEqual(200);
  body = await response.json();
  expect(body).toMatchObject({
    data: {
      __typename: 'Query',
    },
    extensions: {
      responseCache: {
        hit: true,
      },
    },
  });

  const [result1, result2] = results;
  expect(Symbol.for('servedFromResponseCache') in result1).toEqual(false);
  expect(Symbol.for('servedFromResponseCache') in result2).toEqual(true);
  expect(result2[Symbol.for('servedFromResponseCache')]).toEqual(true);
});
