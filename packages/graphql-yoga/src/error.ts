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

export function isOriginalGraphQLError(error: Error): boolean {
  if (error instanceof GraphQLError) {
    if (error.originalError != null) {
      return isOriginalGraphQLError(error.originalError)
    }
    return true
  }
  return false
}

export function handleError(
  error: unknown,
  maskedErrorsOpts: YogaMaskedErrorOpts | null,
): GraphQLError[] {
  const errors = new Set<GraphQLError>()
  if (isAggregateError(error)) {
    for (const singleError of error.errors) {
      const handledErrors = handleError(singleError, maskedErrorsOpts)
      for (const handledError of handledErrors) {
        errors.add(handledError)
      }
    }
  } else if (maskedErrorsOpts) {
    const maskedError = maskedErrorsOpts.formatError(
      error,
      maskedErrorsOpts.errorMessage,
      maskedErrorsOpts.isDev,
    )
    errors.add(maskedError)
  } else if (error instanceof GraphQLError) {
    errors.add(error)
  } else if (error instanceof Error) {
    errors.add(
      createGraphQLError(error.message, {
        originalError: error,
      }),
    )
  } else if (typeof error === 'string') {
    errors.add(
      createGraphQLError(error, {
        extensions: {
          http: {
            status: 500,
          },
        },
      }),
    )
  } else if (hasToString(error)) {
    errors.add(
      createGraphQLError(error.toString(), {
        extensions: {
          http: {
            status: 500,
          },
        },
      }),
    )
  } else {
    errors.add(
      createGraphQLError('Unexpected error!', {
        extensions: {
          http: {
            status: 500,
          },
        },
      }),
    )
  }
  return Array.from(errors)
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
      } else if (!isOriginalGraphQLError(error)) {
        status = 500
      }
    }
  } else {
    status = 200
  }

  if (!status) {
    status = 200
  }

  return {
    status,
    headers,
  }
}
