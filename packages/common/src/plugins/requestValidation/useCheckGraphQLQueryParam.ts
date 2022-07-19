import { createGraphQLError } from '@graphql-tools/utils'
import { Plugin } from '../types'

export function useCheckGraphQLQueryParam(): Plugin {
  return {
    onRequestParse() {
      return {
        onRequestParseDone({ params }) {
          if (params.query == null) {
            throw createGraphQLError('Must provide query string.', {
              extensions: {
                http: {
                  status: 400,
                  headers: {
                    Allow: 'GET, POST',
                  },
                },
              },
            })
          }
          const queryParamType = typeof params.query
          if (queryParamType !== 'string') {
            throw createGraphQLError(
              `Expected "query" to be "string" but given "${queryParamType}".`,
              {
                extensions: {
                  http: {
                    status: 400,
                    headers: {
                      Allow: 'GET, POST',
                    },
                  },
                },
              },
            )
          }
        },
      }
    },
  }
}
