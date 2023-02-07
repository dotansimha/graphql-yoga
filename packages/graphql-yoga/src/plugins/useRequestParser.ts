import { PromiseOrValue } from '@envelop/core'

import { GraphQLParams } from '../types.js'
import { Plugin } from './types.js'

interface RequestParserPluginOptions {
  match?(request: Request, url: URL): boolean
  parse(
    request: Request,
    url: URL,
  ): PromiseOrValue<GraphQLParams> | PromiseOrValue<GraphQLParams[]>
}

const DEFAULT_MATCHER = () => true

export function useRequestParser(options: RequestParserPluginOptions): Plugin {
  const matchFn = options.match || DEFAULT_MATCHER
  return {
    onRequestParse({ request, setRequestParser, url }) {
      if (matchFn(request, url)) {
        setRequestParser(options.parse)
      }
    },
  }
}
