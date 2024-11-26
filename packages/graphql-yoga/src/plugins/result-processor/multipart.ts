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

  const textEncoder = new fetchAPI.TextEncoder();

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
      controller.enqueue(textEncoder.encode('\r\n'));
      controller.enqueue(textEncoder.encode(`---`));
    },
    async pull(controller) {
      try {
        const { done, value } = await iterator.next();
        if (value != null) {
          controller.enqueue(textEncoder.encode('\r\n'));

          controller.enqueue(textEncoder.encode('Content-Type: application/json; charset=utf-8'));
          controller.enqueue(textEncoder.encode('\r\n'));

          const chunk = jsonStringifyResultWithoutInternals(value);
          const encodedChunk = textEncoder.encode(chunk);

          controller.enqueue(textEncoder.encode('Content-Length: ' + encodedChunk.byteLength));
          controller.enqueue(textEncoder.encode('\r\n'));

          controller.enqueue(textEncoder.encode('\r\n'));
          controller.enqueue(encodedChunk);
          controller.enqueue(textEncoder.encode('\r\n'));

          controller.enqueue(textEncoder.encode('---'));
        }

        if (done) {
          controller.enqueue(textEncoder.encode('--\r\n'));
          controller.close();
        }
      } catch (err) {
        controller.error(err);
      }
    },
    async cancel(e) {
      await iterator.return?.(e);
    },
  });

  return new fetchAPI.Response(readableStream, responseInit);
}
