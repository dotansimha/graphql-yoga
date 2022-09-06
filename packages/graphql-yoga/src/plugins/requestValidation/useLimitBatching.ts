import { GraphQLError } from 'graphql'
import { Plugin } from '../types'

export function useLimitBatching(limit?: number): Plugin {
  return {
    onRequestParse() {
      return {
        onRequestParseDone({ requestParserResult }) {
          if (Array.isArray(requestParserResult)) {
            if (!limit) {
              throw new GraphQLError(`Batching is not supported.`, {
                extensions: {
                  http: {
                    status: 400,
                  },
                },
              })
            }
            if (requestParserResult.length > limit) {
              throw new GraphQLError(
                `Batching is limited to ${limit} operations per request.`,
                {
                  extensions: {
                    http: {
                      status: 413,
                    },
                  },
                },
              )
            }
          }
        },
      }
    },
  }
}
