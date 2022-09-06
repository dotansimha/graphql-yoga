import {
  Source,
  pipe,
  share,
  filter,
  takeUntil,
  mergeMap,
  merge,
  make,
} from 'wonka'

import {
  Exchange,
  ExecutionResult,
  makeResult,
  makeErrorResult,
  mergeResultPatch,
  Operation,
  OperationResult,
  getOperationName,
  Client,
  OperationContext,
  ExchangeIO,
  AnyVariables,
} from '@urql/core'

import { ExecutionRequest, isAsyncIterable } from '@graphql-tools/utils'
import {
  LoadFromUrlOptions,
  SubscriptionProtocol,
  UrlLoader,
} from '@graphql-tools/url-loader'
import { OperationTypeNode } from 'graphql'

export type YogaExchangeOptions = LoadFromUrlOptions

function createYogaSourceFactory(
  client: Client,
  options?: YogaExchangeOptions,
) {
  const urlLoader = new UrlLoader()
  return function makeYogaSource<
    TData extends Record<string, any>,
    TVariables extends Record<string, any>,
  >(
    operation: Operation<TData, TVariables>,
  ): Source<OperationResult<TData, AnyVariables>> {
    const operationName = getOperationName(operation.query)
    const executionRequest: ExecutionRequest<TVariables, OperationContext> = {
      document: operation.query,
      operationName,
      operationType: operation.kind as OperationTypeNode,
      variables: operation.variables,
      context: operation.context,
      extensions: {
        endpoint: operation.context.url,
        headers: operation.context.headers,
      },
    }
    const extraFetchOptions =
      typeof operation.context.fetchOptions === 'function'
        ? operation.context.fetchOptions()
        : operation.context.fetchOptions
    const executor = urlLoader.getExecutorAsync(
      options?.endpoint || operation.context.url,
      {
        subscriptionsProtocol: SubscriptionProtocol.SSE,
        multipart: true,
        customFetch: operation.context.fetch,
        useGETForQueries: operation.context.preferGetMethod,
        headers: extraFetchOptions?.headers as Record<string, string>,
        method: extraFetchOptions?.method as 'GET' | 'POST',
        credentials: extraFetchOptions?.credentials,
        ...options,
      },
    )
    return make<OperationResult<TData, AnyVariables>>((observer) => {
      let ended = false
      executor(executionRequest)
        .then(
          async (result: ExecutionResult | AsyncIterable<ExecutionResult>) => {
            if (ended || !result) {
              return
            }
            if (!isAsyncIterable(result)) {
              observer.next(makeResult(operation, result))
            } else {
              let prevResult: OperationResult<TData, AnyVariables> | null = null

              for await (const value of result) {
                if (value) {
                  prevResult = prevResult
                    ? mergeResultPatch(prevResult, value)
                    : makeResult(operation, value)
                  observer.next(prevResult)
                }
                if (ended) {
                  break
                }
              }
            }
            observer.complete()
          },
        )
        .catch((error) => {
          observer.next(makeErrorResult(operation, error))
        })
        .finally(() => {
          ended = true
          observer.complete()
        })
      return () => {
        ended = true
      }
    })
  }
}

export function yogaExchange(options?: YogaExchangeOptions): Exchange {
  return function yogaExchangeFn({ forward, client }): ExchangeIO {
    const makeYogaSource = createYogaSourceFactory(client, options)
    return function yogaExchangeIO<
      TData,
      TVariables,
    >(
      ops$: Source<Operation<TData, TVariables>>,
    ): Source<OperationResult<TData, AnyVariables>> {
      const sharedOps$ = share(ops$)

      const executedOps$ = pipe(
        sharedOps$,
        filter(
          (operation) =>
            operation.kind === 'query' ||
            operation.kind === 'mutation' ||
            operation.kind === 'subscription',
        ),
        mergeMap((operation) => {
          const teardown$ = pipe(
            sharedOps$,
            filter((op) => op.kind === 'teardown' && op.key === operation.key),
          )

          return pipe(makeYogaSource(operation), takeUntil(teardown$))
        }),
      )

      const forwardedOps$ = pipe(
        sharedOps$,
        filter((operation) => operation.kind === 'teardown'),
        forward,
      )

      return merge([executedOps$, forwardedOps$])
    }
  }
}
