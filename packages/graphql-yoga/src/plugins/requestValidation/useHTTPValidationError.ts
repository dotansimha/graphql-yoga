import { AggregateError } from '@graphql-tools/utils'
import { GraphQLError } from 'graphql'
import type { Plugin } from '../types'

export function getAggregateErrorFromErrors(
  errors: readonly GraphQLError[],
): AggregateError {
  errors.forEach((error) => {
    error.extensions.http = {
      status: 400,
    }
    error.extensions.spec = true
  })
  throw new AggregateError(errors)
}

export function useHTTPValidationError<
  // eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
  PluginContext extends Record<string, any> = {},
>(): Plugin<PluginContext> {
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
