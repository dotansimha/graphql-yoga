import { AggregateError, createGraphQLError } from '@graphql-tools/utils'
import { GraphQLError } from 'graphql'
import { YogaMaskedErrorOpts } from '../../types'
import { Plugin } from '../types'

export function getAggregateErrorFromErrors(
  errors: readonly GraphQLError[],
): AggregateError | GraphQLError {
  errors.forEach((error) => {
    error.extensions.http = {
      status: 400,
    }
  })
  if (errors.length === 1) {
    return errors[0]
  }
  return new AggregateError(errors)
}

export function useHTTPValidationError(
  opts: YogaMaskedErrorOpts | null,
): Plugin {
  return {
    onValidate() {
      return ({ valid, result }) => {
        if (!valid) {
          const aggregatedError = getAggregateErrorFromErrors(result)
          if (opts?.handleValidationErrors) {
            throw createGraphQLError(
              opts.errorMessage,
              opts.isDev
                ? {
                    extensions: {
                      originalError: {
                        message: aggregatedError.message,
                        stack: aggregatedError.stack,
                      },
                    },
                  }
                : {},
            )
          } else {
            throw aggregatedError
          }
        }
      }
    },
  }
}
