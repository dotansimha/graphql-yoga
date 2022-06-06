import { EnvelopError } from '@envelop/core'
import { createGraphQLError } from '@graphql-tools/utils'
import { GraphQLError } from 'graphql'

export { EnvelopError as GraphQLYogaError }

export function handleError(
  error: any,
  errors: GraphQLError[] = [],
): GraphQLError[] {
  if (error.errors?.length) {
    errors.push(
      ...error.errors.map((singleError: any) =>
        handleError(singleError, errors),
      ),
    )
  } else if (error instanceof GraphQLError) {
    errors.push(error)
  } else if (error instanceof Error) {
    errors.push(createGraphQLError(error.message))
  } else if (typeof error === 'string') {
    errors.push(createGraphQLError(error))
  } else if (error.toString) {
    errors.push(createGraphQLError(error.toString()))
  } else {
    errors.push(createGraphQLError('Unexpected error!'))
  }
  return errors
}
