import { createGraphQLError } from '@graphql-tools/utils'
import { GraphQLParams } from '../../types'
import { Plugin } from '../types'

const EXPECTED_PARAMS = ['query', 'variables', 'operationName', 'extensions']

export function isValidGraphQLParams(params: any): params is GraphQLParams {
  for (const paramKey in params) {
    if (!EXPECTED_PARAMS.includes(paramKey)) {
      return false
    }
  }
  return true
}

export function useCheckGraphQLParams(): Plugin {
  return {
    onRequestParse() {
      return {
        onRequestParseDone({ params }) {
          if (!('query' in params)) {
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
          if (!isValidGraphQLParams(params)) {
            throw createGraphQLError('Invalid query params.', {
              extensions: {
                http: {
                  status: 400,
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
