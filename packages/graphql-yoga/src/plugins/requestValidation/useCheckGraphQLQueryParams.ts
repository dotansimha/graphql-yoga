import { GraphQLError } from '@graphql-tools/graphql'
import type { GraphQLParams } from '../../types'
import { Plugin } from '../types'

const EXPECTED_PARAMS = ['query', 'variables', 'operationName', 'extensions']

export function assertInvalidParams(
  params: any,
): asserts params is GraphQLParams {
  for (const paramKey in params) {
    if (!EXPECTED_PARAMS.includes(paramKey)) {
      throw new GraphQLError(
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

export function checkGraphQLQueryParams(params: unknown): GraphQLParams {
  if (!isObject(params)) {
    throw new GraphQLError(
      `Expected params to be an object but given ${extendedTypeof(params)}.`,
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

  assertInvalidParams(params)

  if (params.query == null) {
    throw new GraphQLError('Must provide query string.', {
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

  const queryType = extendedTypeof(params.query)
  if (queryType !== 'string') {
    throw new GraphQLError(
      `Expected "query" param to be a string, but given ${queryType}.`,
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

  const variablesParamType = extendedTypeof(params.variables)
  if (!['object', 'null', 'undefined'].includes(variablesParamType)) {
    throw new GraphQLError(
      `Expected "variables" param to be empty or an object, but given ${variablesParamType}.`,
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

  const extensionsParamType = extendedTypeof(params.extensions)
  if (!['object', 'null', 'undefined'].includes(extensionsParamType)) {
    throw new GraphQLError(
      `Expected "extensions" param to be empty or an object, but given ${extensionsParamType}.`,
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

  return params
}

export function isValidGraphQLParams(params: unknown): params is GraphQLParams {
  try {
    checkGraphQLQueryParams(params)
    return true
  } catch {
    return false
  }
}

export function useCheckGraphQLQueryParams(): Plugin {
  return {
    onParams({ params }) {
      checkGraphQLQueryParams(params)
    },
  }
}

function extendedTypeof(
  val: unknown,
):
  | 'string'
  | 'number'
  | 'bigint'
  | 'boolean'
  | 'symbol'
  | 'undefined'
  | 'object'
  | 'function'
  | 'array'
  | 'null' {
  if (val === null) {
    return 'null'
  }
  if (Array.isArray(val)) {
    return 'array'
  }
  return typeof val
}

function isObject(val: unknown): val is Record<PropertyKey, unknown> {
  return extendedTypeof(val) === 'object'
}
