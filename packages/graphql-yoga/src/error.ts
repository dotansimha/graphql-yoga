import { createGraphQLError } from '@graphql-tools/utils'
import { GraphQLError } from 'graphql'
import { ResultProcessorInput } from './plugins/types'
import { YogaMaskedErrorOpts } from './types'

declare module 'graphql' {
  interface GraphQLHTTPErrorExtensions {
    status?: number
    headers?: Record<string, string>
  }
  interface GraphQLErrorExtensions {
    http?: GraphQLHTTPErrorExtensions
  }
}

function isAggregateError(obj: any): obj is AggregateError {
  return obj != null && typeof obj === 'object' && 'errors' in obj
}

function hasToString(obj: any): obj is { toString(): string } {
  return obj != null && typeof obj.toString === 'function'
}

export function handleError(
  error: unknown,
  maskedErrorsOpts: YogaMaskedErrorOpts | null,
  errors: GraphQLError[] = [],
): GraphQLError[] {
  if (isAggregateError(error)) {
    for (const singleError of error.errors) {
      errors.push(...handleError(singleError, maskedErrorsOpts))
    }
  } else if (maskedErrorsOpts) {
    const maskedError = maskedErrorsOpts.formatError(
      error,
      maskedErrorsOpts.errorMessage,
      maskedErrorsOpts.isDev,
    )
    errors.push(maskedError)
  } else {
    if (error instanceof GraphQLError) {
      errors.push(error)
    }
    if (error instanceof Error) {
      errors.push(createGraphQLError(error.message))
    } else if (typeof error === 'string') {
      errors.push(createGraphQLError(error))
    } else if (hasToString(error)) {
      errors.push(createGraphQLError(error.toString()))
    } else {
      errors.push(createGraphQLError('Unexpected error!'))
    }
  }
  return errors
}

export function getResponseInitByRespectingErrors(
  result: ResultProcessorInput,
  headers: Record<string, string> = {},
) {
  let status: number | undefined

  if ('errors' in result && result.errors?.length) {
    for (const error of result.errors) {
      if (error.extensions?.http) {
        if (
          error.extensions.http.status &&
          (!status || error.extensions.http.status > status)
        ) {
          status = error.extensions.http.status
        }
        if (error.extensions.http.headers) {
          Object.assign(headers, error.extensions.http.headers)
        }
      }
    }
  } else {
    status = 200
  }

  return {
    status,
    headers,
  }
}
