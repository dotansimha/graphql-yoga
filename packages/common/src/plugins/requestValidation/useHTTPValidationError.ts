import { AggregateError } from '@graphql-tools/utils'
import { Plugin } from '../types'

export function useHTTPValidationError(): Plugin {
  return {
    onValidate() {
      return ({ valid, result }) => {
        if (!valid) {
          result.forEach((error) => {
            if (error.extensions) {
              error.extensions.http = {
                status: 400,
              }
            }
          })
          throw new AggregateError(result)
        }
      }
    },
  }
}
