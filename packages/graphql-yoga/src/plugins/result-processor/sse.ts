import { ExecutionResult } from 'graphql';
import { isAsyncIterable } from '@envelop/core';
import { fakePromise } from '@whatwg-node/server';
import { getResponseInitByRespectingErrors } from '../../error.js';
import { FetchAPI, MaybeArray } from '../../types.js';
import { ResultProcessor, ResultProcessorInput } from '../types.js';
import { jsonStringifyResultWithoutInternals } from './stringify.js';

export function getSSEProcessor(): ResultProcessor {
  return function processSSEResult(result: ResultProcessorInput, fetchAPI: FetchAPI): Response {
    let pingIntervalMs = 12_000;

    // for testing the pings, reduce the timeout
    if (globalThis.process?.env?.NODE_ENV === 'test') {
      pingIntervalMs = 300;
    }

    const headersInit = {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache',
      'Content-Encoding': 'none',
    };

    const responseInit = getResponseInitByRespectingErrors(result, headersInit, true);

    let iterator: AsyncIterator<MaybeArray<ExecutionResult>>;

    let pingInterval: number;
    const readableStream = new fetchAPI.ReadableStream({
      start(controller) {
        // always start with a ping because some browsers dont accept a header flush
        // causing the fetch to stall until something is streamed through the response
        controller.enqueue(':\n\n');

        // ping client every 12 seconds to keep the connection alive
        pingInterval = setInterval(() => {
          if (!controller.desiredSize) {
            clearInterval(pingInterval);
            return;
          }
          controller.enqueue(':\n\n');
        }, pingIntervalMs) as unknown as number;

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
      },
      pull(controller): void | Promise<void> {
        try {
          return iterator.next().then(
            result => {
              if (result.value != null) {
                controller.enqueue(`event: next\n`);
                const chunk = jsonStringifyResultWithoutInternals(result.value);
                controller.enqueue(`data: ${chunk}\n\n`);
              }
              if (result.done) {
                controller.enqueue(`event: complete\n`);
                controller.enqueue(`data:\n\n`);
                clearInterval(pingInterval);
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
        clearInterval(pingInterval);
        return iterator?.return?.(e)?.then?.(
          () => {
            // ignore
          },
          () => {
            // ignore
          },
        );
      },
    });
    return new fetchAPI.Response(readableStream, responseInit);
  };
}
