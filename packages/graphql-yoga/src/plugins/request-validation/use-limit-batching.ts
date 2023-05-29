import { createGraphQLError } from '../../error.js'
import type { Plugin } from '../types.js'

export function useLimitBatching(limit?: number): Plugin {
  return {
    onRequestParse() {
      return {
        onRequestParseDone({ requestParserResult }) {
          if (Array.isArray(requestParserResult)) {
            if (!limit) {
              throw createGraphQLError(`Batching is not supported.`, {
                extensions: {
                  http: {
                    status: 400,
                  },
                },
              })
            }
            if (requestParserResult.length > limit) {
              throw createGraphQLError(
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
