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

export function handleError(
  error: any,
  errors: GraphQLError[] = [],
): GraphQLError[] {
  if (error.errors?.length) {
    for (const singleError of error.errors) {
      errors.push(...handleError(singleError))
    }
  } else if (error instanceof GraphQLError) {
    errors.push(error)
  } else if (error instanceof Error) {
    errors.push(createGraphQLError(error.message))
  } else if (typeof error === 'string') {
    errors.push(createGraphQLError(error))
  } else if ('toString' in error) {
    errors.push(createGraphQLError(error.toString()))
  } else {
    errors.push(createGraphQLError('Unexpected error!'))
  }
  return errors
}
