import { ExecutionResult } from 'graphql';
import { isAsyncIterable } from '@envelop/core';
import { fakePromise } from '@whatwg-node/server';
import { getResponseInitByRespectingErrors } from '../../error.js';
import { FetchAPI, MaybeArray } from '../../types.js';
import { ResultProcessorInput } from '../types.js';
import { jsonStringifyResultWithoutInternals } from './stringify.js';

export function processMultipartResult(result: ResultProcessorInput, fetchAPI: FetchAPI): Response {
  const headersInit = {
    Connection: 'keep-alive',
    'Content-Type': 'multipart/mixed; boundary="-"',
    'Transfer-Encoding': 'chunked',
  };

  const responseInit = getResponseInitByRespectingErrors(result, headersInit);

  let iterator: AsyncIterator<MaybeArray<ExecutionResult>>;
  const textEncoderStream = new fetchAPI.TextEncoderStream();

  const readableStream = new fetchAPI.ReadableStream({
    start(controller) {
      if (isAsyncIterable(result)) {
        iterator = result[Symbol.asyncIterator]();
      } else {
        let finished = false;
        iterator = {
          next: () => {
            if (finished) {
              return fakePromise({ done: true, value: null });
            }
            finished = true;
            return fakePromise({ done: false, value: result });
          },
        };
      }
      controller.enqueue('\r\n');
      controller.enqueue(`---`);
    },
    pull(controller): void | Promise<void> {
      try {
        return iterator.next().then(
          ({ value, done }) => {
            if (value != null) {
              controller.enqueue('\r\n');

              controller.enqueue('Content-Type: application/json; charset=utf-8');
              controller.enqueue('\r\n');

              const chunk = jsonStringifyResultWithoutInternals(value);

              controller.enqueue('Content-Length: ' + chunk.length);
              controller.enqueue('\r\n');

              controller.enqueue('\r\n');
              controller.enqueue(chunk);
              controller.enqueue('\r\n');

              controller.enqueue('---');
            }

            if (done) {
              controller.enqueue('--\r\n');
              controller.close();
            }
          },
          err => controller.error(err),
        );
      } catch (err) {
        controller.error(err);
      }
    },
    cancel(e) {
      return iterator
        ?.return?.(e)
        ?.finally?.(() =>
          Promise.all([textEncoderStream.writable.abort(e), textEncoderStream.readable.cancel(e)]),
        )
        ?.then?.(
          () => {
            // ignore
          },
          () => {
            // ignore
          },
        );
    },
  });

  return new fetchAPI.Response(readableStream.pipeThrough(textEncoderStream), responseInit);
}
