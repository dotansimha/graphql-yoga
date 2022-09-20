import { createGraphQLError } from '@graphql-tools/utils'
import { GraphQLError } from 'graphql'
import { MaskError } from '@envelop/core'

const isDev = globalThis.process?.env?.NODE_ENV === 'development'

export const yogaDefaultFormatError: MaskError = (err, message) => {
  if (err instanceof GraphQLError) {
    if (err.originalError) {
      if (err.originalError.name === 'GraphQLError') {
        return err
      }
      // Original error should be removed
      const extensions = {
        ...err.extensions,
      }
      if (isDev) {
        extensions.originalError = {
          message: err.originalError.message,
          stack: err.originalError.stack,
        }
      }
      return createGraphQLError(message, {
        nodes: err.nodes,
        source: err.source,
        positions: err.positions,
        path: err.path,
        extensions,
      })
    }
    return err
  }
  return createGraphQLError(message, {
    extensions: {
      http: {
        status: 500,
      },
    },
  })
}
