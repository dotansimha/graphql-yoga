import { Plugin } from './types'
import { PromiseOrValue } from '@envelop/core'
import { GraphQLParams } from '../types'

interface RequestParserPluginOptions {
  match?(request: Request): boolean
  parse(request: Request): PromiseOrValue<GraphQLParams>
}

const DEFAULT_MATCHER = () => true

export function useRequestParser(options: RequestParserPluginOptions): Plugin {
  const matchFn = options.match || DEFAULT_MATCHER
  return {
    onRequestParse({ request, setRequestParser }) {
      if (matchFn(request)) {
        setRequestParser(function useRequestParserFn(request: Request) {
          return options.parse(request)
        })
      }
    },
  }
}
