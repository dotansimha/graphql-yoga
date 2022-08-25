import { AggregateError } from '@graphql-tools/utils'
import { GraphQLError } from 'graphql'
import { Plugin } from '../types'

export function getAggregateErrorFromErrors(
  errors: readonly GraphQLError[],
): AggregateError {
  errors.forEach((error) => {
    error.extensions.http = {
      status: 400,
    }
  })
  throw new AggregateError(errors)
}

export function useHTTPValidationError(): Plugin {
  return {
    onValidate() {
      return ({ valid, result }) => {
        if (!valid) {
          // Typecasting since Envelop is Agnostic to GraphQL.js
          throw getAggregateErrorFromErrors(result as GraphQLError[])
        }
      }
    },
  }
}
