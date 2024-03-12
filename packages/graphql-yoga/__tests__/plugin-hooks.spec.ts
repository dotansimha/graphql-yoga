import { createYoga, type Plugin } from '../src';
import { eventStream } from './utilities';

test('onParams -> setResult to single execution result', async () => {
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

test('onParams -> setResult to event stream execution result', async () => {
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
