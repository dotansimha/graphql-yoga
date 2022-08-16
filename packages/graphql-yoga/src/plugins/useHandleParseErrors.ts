import { Plugin } from '@envelop/core'
import { createGraphQLError } from '@graphql-tools/utils'
import { GraphQLError } from 'graphql'
import { handleError } from '../error'
import { YogaMaskedErrorOpts } from '../types'

export function useHandleParseErrors(opts: YogaMaskedErrorOpts | null): Plugin {
  return {
    onParse() {
      return ({ result, replaceParseResult }) => {
        if (result instanceof Error) {
          if (opts?.handleParseErrors) {
            replaceParseResult(
              createGraphQLError(
                opts.errorMessage,
                opts.isDev
                  ? {
                      extensions: {
                        originalError: {
                          message: result.message,
                          stack: result.stack,
                        },
                      },
                    }
                  : {},
              ),
            )
          } else if (result instanceof GraphQLError) {
            result.extensions.http = result.extensions.http || {}
            result.extensions.http.status = 400
            replaceParseResult(result)
          }
        }
      }
    },
  }
}
