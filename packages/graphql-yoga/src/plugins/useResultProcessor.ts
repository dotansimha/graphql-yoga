import { isAsyncIterable } from '@envelop/core'

import {
  getMediaTypesForRequestInOrder,
  isMatchingMediaType,
} from './resultProcessor/accept.js'
import { processMultipartResult } from './resultProcessor/multipart.js'
import { getSSEProcessor, SSEProcessorOptions } from './resultProcessor/sse.js'
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

function getSSEProcessorConfig(
  opts: SSEProcessorOptions,
): ResultProcessorConfig {
  return {
    mediaTypes: ['text/event-stream'],
    asyncIterables: true,
    processResult: getSSEProcessor(opts),
  }
}

const regular: ResultProcessorConfig = {
  mediaTypes: ['application/graphql-response+json', 'application/json'],
  asyncIterables: false,
  processResult: processRegularResult,
}

export function useResultProcessors(opts: SSEProcessorOptions): Plugin {
  const isSubscriptionRequestMap = new WeakMap<Request, boolean>()

  const sse = getSSEProcessorConfig(opts)
  const defaultList = [sse, multipart, regular]
  const subscriptionList = [multipart, sse, regular]
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
                resultProcessorConfig.processResult,
                processorMediaType,
              )
            }
          }
        }
      }
    },
  }
}
