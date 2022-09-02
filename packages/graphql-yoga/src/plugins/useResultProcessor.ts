import { isAcceptableByRequest } from './resultProcessor/accept.js'
import { Plugin, ResultProcessor } from './types.js'

export interface ResultProcessorPluginOptions {
  processResult: ResultProcessor
  mediaTypes: string[]
}

export function useResultProcessor(
  options: ResultProcessorPluginOptions,
): Plugin {
  return {
    onResultProcess({ request, acceptableMediaTypes, setResultProcessor }) {
      let acceptedMediaType: string | undefined
      for (const mediaType of options.mediaTypes) {
        if (!acceptedMediaType && isAcceptableByRequest(mediaType, request)) {
          acceptedMediaType = mediaType
        }
        acceptableMediaTypes.add(mediaType)
      }
      if (acceptedMediaType) {
        setResultProcessor(options.processResult, acceptedMediaType)
      }
    },
  }
}
