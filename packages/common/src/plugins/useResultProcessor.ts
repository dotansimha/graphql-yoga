import { Plugin, ResultProcessor, ResultProcessorInput } from './types'

export interface ResultProcessorPluginOptions {
  processResult: ResultProcessor
  match?(request: Request, result: ResultProcessorInput): boolean
}

export function useResultProcessor(
  options: ResultProcessorPluginOptions,
): Plugin {
  const isMatch = options.match || (() => true)
  return {
    onResultProcess({ request, result, setResultProcessor }) {
      if (isMatch(request, result)) {
        setResultProcessor(options.processResult)
      }
    },
  }
}
