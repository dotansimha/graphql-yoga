// eslint-disable-next-line import/no-extraneous-dependencies
import { Repeater } from '@repeaterjs/repeater';

/** Parse SSE event stream and yield data pieces. */
export function eventStream<TType = unknown>(source: ReadableStream<Uint8Array>) {
  return new Repeater<TType>(async (push, end) => {
    const cancel: Promise<{ done: true }> = end.then(() => ({ done: true }));
    const iterable = source[Symbol.asyncIterator]();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const result = await Promise.race([cancel, iterable.next()]);

      if (result.done) {
        break;
      }

      const values = Buffer.from(result.value).toString('utf-8').split('\n').filter(Boolean);
      for (const value of values) {
        if (!value.startsWith('data: ')) {
          continue;
        }
        const result = value.replace('data: ', '');
        push(JSON.parse(result));
      }
    }

    iterable.return?.();
    end();
  });
}
