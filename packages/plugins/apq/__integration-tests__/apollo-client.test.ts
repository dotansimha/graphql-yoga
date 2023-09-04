/* eslint-disable import/no-extraneous-dependencies */
import crypto from 'node:crypto';
import { parse, version } from 'graphql';
import { createSchema, createYoga } from 'graphql-yoga';
import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { createPersistedQueryLink } from '@apollo/client/link/persisted-queries';
import { useAPQ } from '@graphql-yoga/plugin-apq';

function sha256(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

describe('Automatic Persisted Queries', () => {
  if (version.startsWith('15')) {
    it('noop', () => {});
    return;
  }
  const server = createYoga({
    schema: createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          foo: String
        }
      `,
      resolvers: {
        Query: {
          foo() {
            return 'bar';
          },
        },
      },
    }),
    plugins: [useAPQ()],
  });

  const fetchSpy = jest.fn(async (info: RequestInfo | URL, init: RequestInit) =>
    server.fetch(info as URL, init),
  );

  const linkChain = createPersistedQueryLink({ sha256 }).concat(
    new HttpLink({ uri: 'http://localhost:4000/graphql', fetch: fetchSpy }),
  );

  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: linkChain,
  });

  it('works', async () => {
    const query = '{\n  foo\n}';
    const { data } = await client.query({ query: parse(query) });

    expect(data).toEqual({ foo: 'bar' });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[0][1]).toMatchObject({
      body: JSON.stringify({
        variables: {},
        extensions: {
          persistedQuery: {
            version: 1,
            sha256Hash: sha256(query),
          },
        },
      }),
      headers: {
        'content-type': 'application/json',
        accept: '*/*',
      },
      method: 'POST',
    });
    expect(fetchSpy.mock.calls[1][1]).toMatchObject({
      body: JSON.stringify({
        variables: {},
        extensions: {
          persistedQuery: {
            version: 1,
            sha256Hash: sha256(query),
          },
        },
        query,
      }),
      headers: {
        'content-type': 'application/json',
        accept: '*/*',
      },
      method: 'POST',
    });
  });
});
