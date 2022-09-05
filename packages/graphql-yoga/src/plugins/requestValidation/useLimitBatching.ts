import { GraphQLError } from 'graphql'
import { Plugin } from '../types'

export function useLimitBatching(limit = Infinity): Plugin {
  return {
    onRequestParse() {
      return {
        onRequestParseDone({ params }) {
          if (Array.isArray(params)) {
            if (params.length > limit) {
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
