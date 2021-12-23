import { Repeater } from '@repeaterjs/repeater'

/**
 * Utility for filtering an event stream.
 */
export function filter<T, U extends T>(
  filter: (input: T) => input is U,
): (source: Repeater<T>) => Repeater<U, void, unknown>
export function filter<T>(
  filter: (input: T) => boolean,
): (source: Repeater<T>) => Repeater<T, void, unknown>
export function filter(filter: (value: unknown) => boolean) {
  return (source: Repeater<unknown>) =>
    new Repeater(async (push, stop) => {
      stop.then(() => {
        source.return()
      })
      for await (const value of source) {
        if (filter(value)) {
          push(value)
        }
      }
    })
}
