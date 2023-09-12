import { isPromise } from '@graphql-tools/utils';

export function iterateAsync<TInput, TOutput>(
  iterable: Iterable<TInput>,
  callback: (input: TInput) => Promise<TOutput> | TOutput,
  results?: NonNullable<TOutput>[],
): Promise<void> | void {
  const iterator = iterable[Symbol.iterator]();
  function iterate(): Promise<void> | void {
    const { done: endOfIterator, value } = iterator.next();
    if (endOfIterator) {
      return;
    }
    const result$ = callback(value);
    if (isPromise(result$)) {
      return result$.then(result => {
        if (result) {
          results?.push(result);
        }
        return iterate();
      });
    }
    if (result$) {
      results?.push(result$);
    }
    return iterate();
  }
  return iterate();
}
