import request from 'supertest';
import { buildApp } from '../src/app.js';

describe('koa', () => {
  const app = buildApp();
  it('should show GraphiQL', async () => {
    const response = await request(app.callback()).get('/graphql').set('Accept', 'text/html');
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
  });
  it('should handle POST requests', async () => {
    const response = await request(app.callback()).post('/graphql').send({ query: '{ hello }' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toStrictEqual({
      data: {
        hello: 'world',
      },
    });
  });
  it('should expose Koa context', async () => {
    const response = await request(app.callback()).post('/graphql').send({ query: '{ isKoa }' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toStrictEqual({
      data: {
        isKoa: true,
      },
    });
  });
});
