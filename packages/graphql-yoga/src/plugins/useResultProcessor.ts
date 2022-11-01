import { isAsyncIterable } from '@envelop/core'
import {
  getMediaTypesForRequestInOrder,
  isMatchingMediaType,
} from './resultProcessor/accept.js'
import { Plugin, ResultProcessor } from './types.js'

export interface ResultProcessorConfig {
  processResult: ResultProcessor
  noAsyncIterable?: boolean
  mediaTypes: string[]
}

export function useResultProcessors(
  resultProcessors: ResultProcessorConfig[],
): Plugin {
  return {
    onResultProcess({
      request,
      result,
      acceptableMediaTypes,
      setResultProcessor,
    }) {
      const requestMediaTypes = getMediaTypesForRequestInOrder(request)
      for (const requestMediaType of requestMediaTypes) {
        for (const resultProcessorConfig of resultProcessors) {
          if (
            isAsyncIterable(result) &&
            resultProcessorConfig.noAsyncIterable
          ) {
            continue
          }
          const processorMediaTypesInOrder = [
            ...resultProcessorConfig.mediaTypes,
          ].reverse()
          for (const processorMediaType of processorMediaTypesInOrder) {
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
