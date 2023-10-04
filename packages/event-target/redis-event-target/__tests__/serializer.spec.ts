import Redis from 'ioredis-mock';
import { CustomEvent } from '@whatwg-node/events';
import { createRedisEventTarget } from '../src';

describe('createRedisEventTarget: serializer arg', () => {
  it('uses native JSON by default', done => {
    const eventTarget = createRedisEventTarget({
      publishClient: new Redis({}),
      subscribeClient: new Redis({}),
    });

    eventTarget.addEventListener('a', (event: CustomEvent) => {
      // Serialized by JSON
      expect(event.detail).toEqual({
        someNumber: 1,
        someBoolean: true,
        someText: 'hi',
      });
      done();
    });

    const event = new CustomEvent('a', {
      detail: {
        someNumber: 1,
        someBoolean: true,
        someText: 'hi',
      },
    });
    eventTarget.dispatchEvent(event);
  });

  it('can use a custom serializer', done => {
    const eventTarget = createRedisEventTarget({
      publishClient: new Redis({}),
      subscribeClient: new Redis({}),
      serializer: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        stringify: (message: any) => `__CUSTOM__${JSON.stringify(message)}`,
        parse: (message: string) => {
          const result = JSON.parse(message.replace(/^__CUSTOM__/, ''));
          for (const key in result) {
            if (typeof result[key] === 'number') {
              result[key]++;
            }
          }
          return result;
        },
      },
    });

    eventTarget.addEventListener('b', (event: CustomEvent) => {
      expect(event.detail).toEqual({
        someNumber: 2,
        someBoolean: true,
        someText: 'hi',
      });
      done();
    });

    const event = new CustomEvent('b', {
      detail: {
        someNumber: 1,
        someBoolean: true,
        someText: 'hi',
      },
    });
    eventTarget.dispatchEvent(event);
  });
});
