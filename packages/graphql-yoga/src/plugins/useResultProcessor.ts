import { isAsyncIterable } from '@envelop/core'

import {
  getMediaTypesForRequestInOrder,
  isMatchingMediaType,
} from './resultProcessor/accept.js'
import { processMultipartResult } from './resultProcessor/multipart.js'
import { processPushResult } from './resultProcessor/push.js'
import { processGraphQLSSEResult } from './resultProcessor/graphql-sse.js'
import { processRegularResult } from './resultProcessor/regular.js'
import { Plugin, ResultProcessor } from './types.js'

interface ResultProcessorConfig {
  processResult: ResultProcessor
  asyncIterables: boolean
  mediaTypes: string[]
}

const multipart: ResultProcessorConfig = {
  mediaTypes: ['multipart/mixed'],
  asyncIterables: true,
  processResult: processMultipartResult,
}

const textEventStream: ResultProcessorConfig = {
  mediaTypes: ['text/event-stream'],
  asyncIterables: true,
  processResult: processPushResult,
}

const regular: ResultProcessorConfig = {
  mediaTypes: ['application/graphql-response+json', 'application/json'],
  asyncIterables: false,
  processResult: processRegularResult,
}

const defaultList = [textEventStream, multipart, regular]
const subscriptionList = [multipart, textEventStream, regular]

export function useResultProcessors(opts: { graphqlSse: boolean }): Plugin {
  const isSubscriptionRequestMap = new WeakMap<Request, boolean>()
  return {
    onSubscribe({ args: { contextValue } }) {
      if (contextValue.request) {
        isSubscriptionRequestMap.set(contextValue.request, true)
      }
    },
    onResultProcess({
      request,
      result,
      acceptableMediaTypes,
      setResultProcessor,
    }) {
      const isSubscriptionRequest = isSubscriptionRequestMap.get(request)
      const processorConfigList = isSubscriptionRequest
        ? subscriptionList
        : defaultList
      const requestMediaTypes = getMediaTypesForRequestInOrder(request)
      const isAsyncIterableResult = isAsyncIterable(result)
      for (const requestMediaType of requestMediaTypes) {
        for (const resultProcessorConfig of processorConfigList) {
          if (isAsyncIterableResult && !resultProcessorConfig.asyncIterables) {
            continue
          }
          for (const processorMediaType of resultProcessorConfig.mediaTypes) {
            acceptableMediaTypes.push(processorMediaType)
            if (isMatchingMediaType(processorMediaType, requestMediaType)) {
              setResultProcessor(
                opts.graphqlSse &&
                  resultProcessorConfig.processResult === processPushResult
                  ? processGraphQLSSEResult
                  : resultProcessorConfig.processResult,
                processorMediaType,
              )
            }
          }
        }
      }
    },
  }
}
