import { Plugin, ResultProcessor, ResultProcessorInput } from './types.js'

export interface ResultProcessorPluginOptions {
  processResult: ResultProcessor
  match?(request: Request, result: ResultProcessorInput): boolean
}

export function useResultProcessor(
  options: ResultProcessorPluginOptions,
): Plugin {
  const matchFn = options.match || (() => true)
  return {
    onResultProcess({ request, result, setResultProcessor }) {
      if (matchFn(request, result)) {
        setResultProcessor(options.processResult)
      }
    },
  }
}
