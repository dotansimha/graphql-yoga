import { createSchema, createYoga, type Plugin } from '../src';
import { eventStream } from './utilities';

describe('Plugin hooks', () => {
  it('context value identity stays the same in all hooks', async () => {
    const contextValues = [] as Array<unknown>;
    const yoga = createYoga({
      schema: createSchema({ typeDefs: `type Query {a:String}` }),
      plugins: [
        {
          onParams(ctx) {
            contextValues.push(ctx.context);
          },
          onParse(ctx) {
            contextValues.push(ctx.context);
          },
          onValidate(ctx) {
            contextValues.push(ctx.context);
          },
          onContextBuilding(ctx) {
            contextValues.push(ctx.context);
            // mutate context
            ctx.extendContext({ a: 1 } as Record<string, unknown>);
            contextValues.push(ctx.context);
          },
          onExecute(ctx) {
            contextValues.push(ctx.args.contextValue);
          },
          onResponse(ctx) {
            contextValues.push(ctx.serverContext);
          },
        } satisfies Plugin,
      ],
    });

    const response = await yoga.fetch('http://localhost/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{__typename}' }),
    });
    expect(response.status).toEqual(200);
    expect(await response.json()).toEqual({ data: { __typename: 'Query' } });
    expect(contextValues).toHaveLength(7);
    for (const value of contextValues) {
      expect(value).toBe(contextValues[0]);
    }
  });

  describe('onParams', () => {
    it('setResult to single execution result', async () => {
      const plugin: Plugin = {
        async onParams({ setResult }) {
          setResult({ data: { hello: 'world' } });
        },
      };

      const yoga = createYoga({ plugins: [plugin] });

      const result = await yoga.fetch('http://yoga/graphql', {
        method: 'POST',
        body: JSON.stringify({ query: '{ hello }' }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(result.status).toBe(200);
      const body = await result.json();
      expect(body).toEqual({ data: { hello: 'world' } });
    });

    it('setResult to event stream execution result', async () => {
      const plugin: Plugin = {
        async onParams({ setResult }) {
          setResult(
            (async function* () {
              yield { data: { hello: 'hee' } };
              yield { data: { hello: 'hoo' } };
            })(),
          );
        },
      };

      const yoga = createYoga({ plugins: [plugin] });

      const result = await yoga.fetch('http://yoga/graphql', {
        method: 'POST',
        body: JSON.stringify({ query: '{ hello }' }),
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
      });

      expect(result.status).toBe(200);
      let counter = 0;
      for await (const value of eventStream(result.body!)) {
        if (counter === 0) {
          expect(value).toEqual({ data: { hello: 'hee' } });
          counter++;
        } else if (counter === 1) {
          expect(value).toEqual({ data: { hello: 'hoo' } });
          counter++;
        }
      }
      expect(counter).toBe(2);
    });
  });

  describe('onOperation', () => {
    it('should allow to override the graphql operation handling', async () => {
      const operationHandler = jest.fn().mockReturnValue({ foo: 'bar' });
      const plugin: Plugin = {
        onOperation: jest.fn().mockImplementation(({ setOperationHandler }) => {
          setOperationHandler(operationHandler);
        }),
        onEnveloped: jest.fn(),
      };

      const yoga = createYoga({ plugins: [plugin] });

      const result = await yoga.fetch('http://yoga/graphql', {
        method: 'POST',
        body: JSON.stringify({ query: '{ hello }' }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(result.status).toBe(200);
      const body = await result.json();
      expect(body).toEqual({ foo: 'bar' });

      expect(operationHandler).toHaveBeenCalled();
      // The entire graphql operation process should have been replaced
      expect(plugin.onEnveloped).not.toHaveBeenCalled();

      expect(plugin.onOperation).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.any(Object),
          params: expect.any(Object),
          context: expect.objectContaining({
            waitUntil: expect.any(Function),
          }),
          operationHandler: expect.any(Function),
          setOperationHandler: expect.any(Function),
        }),
      );
    });
  });
});
