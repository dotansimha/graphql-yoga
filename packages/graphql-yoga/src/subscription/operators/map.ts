import { Repeater } from '@repeaterjs/repeater'

/**
 * Utility for mapping an event stream.
 */
export const map =
  <T, O>(mapper: (input: T) => Promise<O> | O) =>
  (source: Repeater<T>): Repeater<O> =>
    new Repeater(async (push, stop) => {
      stop.then(() => {
        source.return()
      })
      for await (const value of source) {
        push(await mapper(value))
      }
    })
