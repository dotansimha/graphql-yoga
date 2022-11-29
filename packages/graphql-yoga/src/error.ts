import { createGraphQLError } from '@graphql-tools/utils'
import { GraphQLError } from 'graphql'
import type { YogaLogger } from './logger.js'
import type { ResultProcessorInput } from './plugins/types.js'
import type { YogaMaskedErrorOpts } from './types.js'

export { createGraphQLError }

declare module 'graphql' {
  interface GraphQLHTTPErrorExtensions {
    spec?: boolean
    status?: number
    headers?: Record<string, string>
  }
  interface GraphQLErrorExtensions {
    http?: GraphQLHTTPErrorExtensions
    unexpected?: boolean
  }
}

function isAggregateError(obj: unknown): obj is AggregateError {
  return obj != null && typeof obj === 'object' && 'errors' in obj
}

function hasToString(obj: unknown): obj is { toString(): string } {
  return obj != null && typeof obj.toString === 'function'
}

export function isGraphQLError(val: unknown): val is GraphQLError {
  return val instanceof GraphQLError
}

export function isOriginalGraphQLError(
  val: unknown,
): val is GraphQLError & { originalError: GraphQLError } {
  if (val instanceof GraphQLError) {
    if (val.originalError != null) {
      return isOriginalGraphQLError(val.originalError)
    }
    return true
  }
  return false
}

export function handleError(
  error: unknown,
  maskedErrorsOpts: YogaMaskedErrorOpts | null,
  logger: YogaLogger,
): GraphQLError[] {
  const errors = new Set<GraphQLError>()
  if (isAggregateError(error)) {
    for (const singleError of error.errors) {
      const handledErrors = handleError(singleError, maskedErrorsOpts, logger)
      for (const handledError of handledErrors) {
        errors.add(handledError)
      }
    }
  } else if (maskedErrorsOpts) {
    const maskedError = maskedErrorsOpts.maskError(
      error,
      maskedErrorsOpts.errorMessage,
    )

    if (maskedError !== error) {
      logger.error(error)
    }

    errors.add(
      isGraphQLError(maskedError)
        ? maskedError
        : createGraphQLError(maskedError.message, {
            originalError: maskedError,
          }),
    )
  } else if (isGraphQLError(error)) {
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
          unexpected: true,
        },
      }),
    )
  } else if (hasToString(error)) {
    errors.add(
      createGraphQLError(error.toString(), {
        extensions: {
          unexpected: true,
        },
      }),
    )
  } else {
    logger.error(error)
    errors.add(
      createGraphQLError('Unexpected error.', {
        extensions: {
          http: {
            unexpected: true,
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
  isApplicationJson = false,
) {
  let status: number | undefined
  let unexpectedErrorExists = false

  if ('errors' in result && result.errors?.length) {
    for (const error of result.errors) {
      if (error.extensions?.http) {
        if (error.extensions.http.headers) {
          Object.assign(headers, error.extensions.http.headers)
        }
        if (isApplicationJson && error.extensions.http.spec) {
          continue
        }
        if (
          error.extensions.http.status &&
          (!status || error.extensions.http.status > status)
        ) {
          status = error.extensions.http.status
        }
      } else if (
        !isOriginalGraphQLError(error) ||
        error.extensions?.unexpected
      ) {
        unexpectedErrorExists = true
      }
    }
  } else {
    status = 200
  }

  if (!status) {
    if (unexpectedErrorExists && !('data' in result)) {
      status = 500
    } else {
      status = 200
    }
  }

  return {
    status,
    headers,
  }
}
