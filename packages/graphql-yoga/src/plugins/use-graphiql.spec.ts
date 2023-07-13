import { createYoga } from '../server';

describe('GraphiQL', () => {
  describe('when received an option factory that returns Promise', () => {
    it('should respect graphiql option', async () => {
      const yoga = createYoga({
        graphiql: () => Promise.resolve({ title: 'Test GraphiQL' }),
      });
      const response = await yoga.fetch('http://localhost:3000/graphql', {
        method: 'GET',
        headers: {
          Accept: 'text/html',
        },
      });
      expect(response.headers.get('content-type')).toEqual('text/html');
      const result = await response.text();
      expect(result).toMatch(/<title>Test GraphiQL<\/title>/);
    });

    it('returns error when graphiql is disabled', async () => {
      const yoga = createYoga({
        graphiql: () => Promise.resolve(false),
      });
      const response = await yoga.fetch('http://localhost:3000/graphql', {
        method: 'GET',
        headers: {
          Accept: 'text/html',
        },
      });
      expect(response.headers.get('content-type')).not.toEqual('text/html');
      expect(response.status).toEqual(406);
    });
  });
});
