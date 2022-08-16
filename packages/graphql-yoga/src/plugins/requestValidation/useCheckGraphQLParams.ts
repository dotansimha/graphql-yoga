import { createGraphQLError } from '@graphql-tools/utils'
import { GraphQLParams } from '../../types'
import { Plugin } from '../types'

const EXPECTED_PARAMS = ['query', 'variables', 'operationName', 'extensions']

export function assertInvalidParams(
  params: any,
): asserts params is GraphQLParams {
  for (const paramKey in params) {
    if (!EXPECTED_PARAMS.includes(paramKey)) {
      throw createGraphQLError(
        `Unexpected parameter "${paramKey}" in the request body.`,
        {
          extensions: {
            http: {
              status: 400,
            },
          },
        },
      )
    }
  }
}

export function useCheckGraphQLParams(): Plugin {
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
          assertInvalidParams(params)
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
