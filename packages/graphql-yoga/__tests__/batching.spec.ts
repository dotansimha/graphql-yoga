import { createSchema, createYoga, getBatchRequestIndexFromContext, Plugin } from '../src/index.js';

describe('Batching', () => {
  const schema = createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        hello: String
        bye: String
      }
    `,
    resolvers: {
      Query: {
        hello: () => 'hello',
        bye: () => 'bye',
      },
    },
  });
  const yoga = createYoga({
    schema,
    batching: true,
  });
  it('should support batching for JSON requests', async () => {
    const query1 = /* GraphQL */ `
      query {
        hello
      }
    `;
    const query2 = /* GraphQL */ `
      query {
        bye
      }
    `;
    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ query: query1 }, { query: query2 }]),
    });
    const result = await response.json();
    expect(result).toEqual([{ data: { hello: 'hello' } }, { data: { bye: 'bye' } }]);
  });
  it('should support batching for multipart requests', async () => {
    const query1 = /* GraphQL */ `
      query {
        hello
      }
    `;
    const query2 = /* GraphQL */ `
      query {
        bye
      }
    `;
    const formData = new yoga.fetchAPI.FormData();
    formData.append('operations', JSON.stringify([{ query: query1 }, { query: query2 }]));
    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      body: formData,
    });
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result).toEqual([{ data: { hello: 'hello' } }, { data: { bye: 'bye' } }]);
  });
  it('should throw if the default limit is exceeded', async () => {
    const query1 = /* GraphQL */ `
      query {
        hello
      }
    `;
    const query2 = /* GraphQL */ `
      query {
        bye
      }
    `;
    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        accept: 'application/graphql-response+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        { query: query1 },
        { query: query2 },
        { query: query1 },
        { query: query2 },
        { query: query1 },
        { query: query2 },
        { query: query1 },
        { query: query2 },
        { query: query1 },
        { query: query2 },
        { query: query1 },
        { query: query2 },
      ]),
    });
    expect(response.status).toBe(413);
    const result = await response.json();
    expect(result).toEqual({
      errors: [
        {
          message: 'Batching is limited to 10 operations per request.',
        },
      ],
    });
  });
  it('should not support batching by default', async () => {
    const noBatchingYoga = createYoga({
      schema,
    });
    const query1 = /* GraphQL */ `
      query {
        hello
      }
    `;
    const query2 = /* GraphQL */ `
      query {
        bye
      }
    `;
    const response = await noBatchingYoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        accept: 'application/graphql-response+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ query: query1 }, { query: query2 }]),
    });
    expect(response.status).toBe(400);
    const result = await response.json();
    expect(result).toEqual({
      errors: [
        {
          message: 'Batching is not supported.',
        },
      ],
    });
  });
  it('should respect `batching.limit` option', async () => {
    const yoga = createYoga({
      schema,
      batching: {
        limit: 2,
      },
    });
    const query1 = /* GraphQL */ `
      query {
        hello
      }
    `;
    const query2 = /* GraphQL */ `
      query {
        bye
      }
    `;

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        accept: 'application/graphql-response+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ query: query1 }, { query: query2 }, { query: query1 }]),
    });

    expect(response.status).toBe(413);
    const result = await response.json();
    expect(result).toEqual({
      errors: [
        {
          message: 'Batching is limited to 2 operations per request.',
        },
      ],
    });
  });
  it('should not allow batching if `batching: false`', async () => {
    const yoga = createYoga({
      schema,
      batching: false,
    });
    const query1 = /* GraphQL */ `
      query {
        hello
      }
    `;
    const query2 = /* GraphQL */ `
      query {
        bye
      }
    `;
    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        accept: 'application/graphql-response+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ query: query1 }, { query: query2 }]),
    });
    expect(response.status).toBe(400);
    const result = await response.json();
    expect(result).toEqual({
      errors: [
        {
          message: 'Batching is not supported.',
        },
      ],
    });
  });
  it('should not allow batching if `batching.limit` is 0', async () => {
    const yoga = createYoga({
      schema,
      batching: {
        limit: 0,
      },
    });
    const query1 = /* GraphQL */ `
      query {
        hello
      }
    `;
    const query2 = /* GraphQL */ `
      query {
        bye
      }
    `;
    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        accept: 'application/graphql-response+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ query: query1 }, { query: query2 }]),
    });
    expect(response.status).toBe(400);
    const result = await response.json();
    expect(result).toEqual({
      errors: [
        {
          message: 'Batching is not supported.',
        },
      ],
    });
  });
  it('should set `batching.limit` to 10 by default', async () => {
    const yoga = createYoga({
      schema,
      batching: {},
    });
    const query1 = /* GraphQL */ `
      query {
        hello
      }
    `;
    const query2 = /* GraphQL */ `
      query {
        bye
      }
    `;
    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        accept: 'application/graphql-response+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        { query: query1 },
        { query: query2 },
        { query: query1 },
        { query: query2 },
        { query: query1 },
        { query: query2 },
        { query: query1 },
        { query: query2 },
        { query: query1 },
        { query: query2 },
        { query: query1 },
        { query: query2 },
      ]),
    });
    expect(response.status).toBe(413);
    const result = await response.json();
    expect(result).toEqual({
      errors: [
        {
          message: 'Batching is limited to 10 operations per request.',
        },
      ],
    });
  });
  it('batching index is forwarded into hooks (single batch)', async () => {
    const yoga = createYoga({
      schema,
      batching: true,
      plugins: [
        {
          onParams(params) {
            expect(params.batchedRequestIndex).toEqual(0);
          },
          onParse(context) {
            expect(getBatchRequestIndexFromContext(context.context)).toEqual(0);
          },
          onValidate(context) {
            expect(getBatchRequestIndexFromContext(context.context)).toEqual(0);
          },
          onExecute(context) {
            expect(getBatchRequestIndexFromContext(context.args.contextValue)).toEqual(0);
          },
        } satisfies Plugin,
      ],
    });

    const response = await yoga.fetch('http://yoga.com/graphql', {
      method: 'POST',
      headers: {
        accept: 'application/graphql-response+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ query: '{hello}' }]),
    });
    expect(await response.text()).toEqual(`[{"data":{"hello":"hello"}}]`);
  });
  it('batching index is forwarded into hooks (multiple batches)', async () => {
    const yoga = createYoga({
      schema,
      batching: true,
      plugins: [
        {
          onParams(context) {
            const params = JSON.stringify(context.params);
            if (params === '{"source":"{hello}"}') {
              expect(context.batchedRequestIndex).toEqual(0);
            } else if (params === '{"source":"{bye}"}') {
              expect(context.batchedRequestIndex).toEqual(1);
            }
          },
          onParse(context) {
            const params = JSON.stringify(context.params);
            if (params === '{"source":"{hello}"}') {
              expect(getBatchRequestIndexFromContext(context.context)).toEqual(0);
            } else if (params === '{"source":"{bye}"}') {
              expect(getBatchRequestIndexFromContext(context.context)).toEqual(1);
            }
          },
          onValidate(context) {
            const params = JSON.stringify(context.params);
            if (params === '{"source":"{hello}"}') {
              expect(getBatchRequestIndexFromContext(context.context)).toEqual(0);
            } else if (params === '{"source":"{bye}"}') {
              expect(getBatchRequestIndexFromContext(context.context)).toEqual(1);
            }
          },
          onExecute(context) {
            const params = JSON.stringify(context.args.contextValue.params);
            if (params === '{"source":"{hello}"}') {
              expect(getBatchRequestIndexFromContext(context.args.contextValue)).toEqual(0);
            } else if (params === '{"source":"{bye}"}') {
              expect(getBatchRequestIndexFromContext(context.args.contextValue)).toEqual(1);
            }
          },
        } satisfies Plugin,
      ],
    });

    const response = await yoga.fetch('http://yoga.com/graphql', {
      method: 'POST',
      headers: {
        accept: 'application/graphql-response+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ query: '{hello}' }, { query: '{bye}' }]),
    });
    expect(await response.text()).toEqual(`[{"data":{"hello":"hello"}},{"data":{"bye":"bye"}}]`);
  });
});
