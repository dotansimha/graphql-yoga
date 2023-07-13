import { getIntrospectionQuery } from 'graphql';
import { Request } from '@whatwg-node/fetch';
import worker from '../src/index.js';

test('should render GraphiQL', async () => {
  // Note we're using Worker APIs in our test, without importing anything extra
  const request = new Request('http://localhost/graphql', {
    method: 'GET',
    headers: {
      Accept: 'text/html',
    },
  });
  const response = await worker.fetch(request, {});

  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toBe('text/html');
  expect(await response.text()).toMatch(/GraphiQL/);
});

test('should succeeds introspection query', async () => {
  // Note we're using Worker APIs in our test, without importing anything extra
  const request = new Request('http://localhost/graphql', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: getIntrospectionQuery(),
    }),
  });
  const response = await worker.fetch(request, {});

  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toContain('application/json');
  expect(await response.json()).toMatchObject({
    data: {
      __schema: {
        queryType: {
          name: 'Query',
        },
      },
    },
  });
});

test('should succeeds introspection query with custom route', async () => {
  // Note we're using Worker APIs in our test, without importing anything extra
  const request = new Request('http://localhost/api', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: getIntrospectionQuery(),
    }),
  });
  const response = await worker.fetch(request, {
    GRAPHQL_ROUTE: '/api',
  });

  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toContain('application/json');
  expect(await response.json()).toMatchObject({
    data: {
      __schema: {
        queryType: {
          name: 'Query',
        },
      },
    },
  });
});
