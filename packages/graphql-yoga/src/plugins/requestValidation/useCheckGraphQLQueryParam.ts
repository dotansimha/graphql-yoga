import { createGraphQLError } from '@graphql-tools/utils'
import { GraphQLParams } from '../../types'
import { Plugin } from '../types'

export function isValidGraphQLParams(params: any): params is GraphQLParams {
  return params.query != null
}

export function useCheckGraphQLQueryParam(): Plugin {
  return {
    onRequestParse() {
      return {
        onRequestParseDone({ params }) {
          if (!isValidGraphQLParams(params)) {
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
