import { Plugin, ResultProcessor, ResultProcessorInput } from './types.js'

export interface ResultProcessorPluginOptions<
  TResult extends ResultProcessorInput,
> {
  processResult: ResultProcessor<TResult>
  match?(request: Request, result: ResultProcessorInput): result is TResult
}

export function useResultProcessor<
  TResult extends ResultProcessorInput = ResultProcessorInput,
>(options: ResultProcessorPluginOptions<TResult>): Plugin {
  const matchFn = options.match || (() => true)
  return {
    onResultProcess({ request, result, setResultProcessor }) {
      if (matchFn(request, result)) {
        setResultProcessor(options.processResult)
      }
    },
  }
}
