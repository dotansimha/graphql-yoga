import { Repeater } from 'graphql-yoga';
import { createDeferred } from '../../../testing-utils/create-deferred';

export const createPushPullAsyncIterable = <T>(): {
  source: AsyncGenerator<T>;
  push: (item: T) => void;
  terminate: () => void;
} => {
  const queue: Array<T> = [];
  let d = createDeferred();
  let terminated = false;

  const source = new Repeater<T>(async (push, stop) => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (terminated) {
        stop();
        return;
      }
      let item: T | undefined;
      while ((item = queue.shift())) {
        push(item);
      }
      await d.promise;
    }
  });

  return {
    source,
    push: item => {
      queue.push(item);
      d.resolve();
      d = createDeferred();
    },
    terminate: () => {
      terminated = true;
      d.resolve();
    },
  };
};
