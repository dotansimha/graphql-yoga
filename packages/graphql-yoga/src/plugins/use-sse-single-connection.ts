import { ExecutionResult } from 'graphql';
import { isAsyncIterable } from '@graphql-tools/utils';
import { createPubSub, map, pipe, Repeater, type PubSub } from '@graphql-yoga/subscription';
import { TypedEventTarget } from '@graphql-yoga/typed-event-target';
import { YogaInitialContext } from '../types.js';
import type { Plugin, ResultProcessorInput } from './types.js';

type SSEPubSub = PubSub<{
  'graphql-sse-subscribe': [string, string];
  'graphql-sse-unsubscribe': [string, boolean];
}>;

export interface SSESingleConnectionPluginOptions {
  eventTarget?: TypedEventTarget<CustomEvent>;
}

export function useSSESingleConnection(
  options?: SSESingleConnectionPluginOptions,
): Plugin<YogaInitialContext, { waitUntil(p: Promise<unknown>): void }> {
  const eventTarget: TypedEventTarget<CustomEvent> = options?.eventTarget ?? new EventTarget();
  const pubSub = createPubSub({
    eventTarget,
  });
  const tokenByRequest = new WeakMap<Request, string>();
  const operationIdByRequest = new WeakMap<Request, string>();
  const tokenReservations = new Map<string, Request>();

  return {
    onRequest({ request, url, fetchAPI, endResponse }) {
      const streamToken =
        request.headers.get('X-GraphQL-Event-Stream-Token') || url.searchParams.get('token');

      if (!streamToken) {
        return;
      }

      const acceptHeader = request.headers.get('Accept');
      if (acceptHeader?.includes('text/event-stream') && request.method === 'GET') {
        const reservation = tokenReservations.get(streamToken);
        if (reservation) {
          endResponse(
            new fetchAPI.Response(null, {
              status: 409,
              statusText: 'Conflict',
            }),
          );
        } else {
          tokenReservations.set(streamToken, request);
          const encoder = new fetchAPI.TextEncoder();
          // TODO:
          // Maybe auto-close the stream after some time without operations being registered?

          const eventStream = new Repeater<string>(async (push, stop) => {
            function eventListener(event: CustomEvent) {
              push(event.detail as string);
            }

            // TODO: in case of a conflict, the client that causes the conflict could use that information for executing GraphQL operations on behalf of that stream token
            // instead we should generate a new stream token for the client that it should use for sending graphql requests and send it to the client as part of the ready event.

            stop.then(() => {
              eventTarget.removeEventListener(
                `graphql-sse-subscribe:${streamToken}`,
                eventListener,
              );
            });

            await eventTarget.addEventListener(
              `graphql-sse-subscribe:${streamToken}`,
              eventListener,
            );

            // Notify client that the connection is ready
            await push('event: ready\n\n');
          });

          const stream = Repeater.merge([
            pipe(
              eventStream,
              map((str: string) => {
                return encoder.encode(str);
              }),
            ),
            new Repeater(async (_, stop) => {
              request.signal.addEventListener('abort', () => {
                stop(request.signal.reason);
              });
            }),
          ]);

          const response = new fetchAPI.Response(stream as unknown as BodyInit, {
            status: 200,
            headers: {
              'Content-Type': 'text/event-stream',
            },
          });

          endResponse(response);
        }

        return;
      }
      tokenByRequest.set(request, streamToken);
    },
    onParams({ request, params }) {
      if (tokenByRequest.has(request) && params?.extensions?.operationId) {
        operationIdByRequest.set(request, params.extensions.operationId);
      }
    },
    onResultProcess({ request, result, fetchAPI, endResponse }) {
      const token = tokenByRequest.get(request);
      const operationId = operationIdByRequest.get(request);

      if (token && operationId) {
        // serverContext.waitUntil(
        Promise.resolve().then(
          () =>
            runOperation({
              pubSub,
              operationId,
              token,
              result,
            }),
          //   ),
        );
        endResponse(
          new fetchAPI.Response(null, {
            status: 202,
          }),
        );
      }
    },
  };
}

async function runOperation(args: {
  pubSub: SSEPubSub;
  operationId: string;
  token: string;
  result: ResultProcessorInput;
}) {
  if (isAsyncIterable(args.result)) {
    const asyncIterator = args.result[Symbol.asyncIterator]();
    let breakLoop = false;
    args.pubSub
      .subscribe('graphql-sse-unsubscribe', args.operationId)
      .next()
      .finally(() => {
        breakLoop = true;
        return asyncIterator.return?.();
      });
    const asyncIterable: AsyncIterable<ExecutionResult> = {
      [Symbol.asyncIterator]: () => asyncIterator,
    };
    for await (const chunk of asyncIterable) {
      if (breakLoop) {
        break;
      }
      const messageJson = {
        id: args.operationId,
        payload: chunk,
      };
      const messageStr = `event: next\nid: ${args.operationId}\ndata: ${JSON.stringify(
        messageJson,
      )}\n\n`;
      args.pubSub.publish('graphql-sse-subscribe', args.token, messageStr);
    }
  } else {
    const messageJson = {
      id: args.operationId,
      payload: args.result,
    };
    const messageStr = `event: next\nid: ${args.operationId}\ndata: ${JSON.stringify(
      messageJson,
    )}\n\n`;
    args.pubSub.publish('graphql-sse-subscribe', args.token, messageStr);
  }
  const completeMessageJson = {
    id: args.operationId,
  };
  const completeMessageStr = `event: complete\ndata: ${JSON.stringify(completeMessageJson)}\n\n`;
  args.pubSub.publish('graphql-sse-subscribe', args.token, completeMessageStr);
}
