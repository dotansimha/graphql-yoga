import { Repeater } from '@repeaterjs/repeater';

/**
 * Utility for filtering an event stream.
 */
export function filter<T, U extends T>(
  filter: (input: T) => input is U,
): (source: AsyncIterable<T>) => Repeater<U, void, unknown>;
export function filter<T>(
  filter: (input: T) => Promise<boolean> | boolean,
): (source: AsyncIterable<T>) => Repeater<T, void, unknown>;
export function filter(filter: (value: unknown) => Promise<boolean> | boolean) {
  return (source: AsyncIterable<unknown>) =>
    new Repeater(async (push, stop) => {
      const iterable = source[Symbol.asyncIterator]();
      stop.then(() => {
        iterable.return?.();
      });

      let latest: IteratorResult<unknown>;
      while ((latest = await iterable.next()).done === false) {
        if (await filter(latest.value)) {
          await push(latest.value);
        }
      }
      stop();
    });
}
