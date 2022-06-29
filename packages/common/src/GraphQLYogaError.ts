import { EnvelopError } from '@envelop/core'
import { createGraphQLError } from '@graphql-tools/utils'
import { GraphQLError } from 'graphql'

declare module 'graphql' {
  interface GraphQLHTTPErrorExtensions {
    status?: number
    headers?: Record<string, string>
  }
  interface GraphQLErrorExtensions {
    http?: GraphQLHTTPErrorExtensions
  }
}

export { EnvelopError as GraphQLYogaError }

function isAggregateError(obj: any): obj is AggregateError {
  return obj != null && typeof obj === 'object' && 'errors' in obj
}

function hasToString(obj: any): obj is { toString(): string } {
  return obj != null && typeof obj.toString === 'function'
}

export function handleError(
  error: unknown,
  errors: GraphQLError[] = [],
): GraphQLError[] {
  if (isAggregateError(error)) {
    for (const singleError of error.errors) {
      errors.push(...handleError(singleError))
    }
  } else if (error instanceof GraphQLError) {
    errors.push(error)
  } else if (error instanceof Error) {
    errors.push(createGraphQLError(error.message))
  } else if (typeof error === 'string') {
    errors.push(createGraphQLError(error))
  } else if (hasToString(error)) {
    errors.push(createGraphQLError(error.toString()))
  } else {
    errors.push(createGraphQLError('Unexpected error!'))
  }
  return errors
}
