export function createDeferred<T = void>(): PromiseWithResolvers<T> {
  if (Promise.withResolvers) {
    return Promise.withResolvers<T>();
  }
  let _resolve: (value: T | PromiseLike<T>) => void;
  let _reject: (value: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    _resolve = resolve;
    _reject = reject;
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return { promise, resolve: _resolve!, reject: _reject! };
}
