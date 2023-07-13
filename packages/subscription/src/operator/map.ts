import { Repeater } from '@repeaterjs/repeater';

/**
 * Utility for mapping an event stream.
 */
export const map =
  <T, O>(mapper: (input: T) => Promise<O> | O) =>
  (source: AsyncIterable<T>): Repeater<O> =>
    new Repeater(async (push, stop) => {
      const iterable = source[Symbol.asyncIterator]();
      stop.then(() => {
        iterable.return?.();
      });

      let latest: IteratorResult<T>;
      while ((latest = await iterable.next()).done === false) {
        await push(await mapper(latest.value));
      }
      stop();
    });
