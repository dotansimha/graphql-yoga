import { GraphQLErrorExtensions } from 'graphql'
import { createGraphQLError } from '@graphql-tools/utils'

import { isGraphQLError } from '../error.js'
import { MaskError } from '../types.js'

export const yogaDefaultFormatError: MaskError = (
  error: unknown,
  message: string,
  isDev = globalThis.process?.env?.NODE_ENV === 'development',
) => {
  if (isGraphQLError(error)) {
    if (error.originalError) {
      if (error.originalError.name === 'GraphQLError') {
        return error
      }
      // Original error should be removed
      const extensions: GraphQLErrorExtensions = {
        ...error.extensions,
        unexpected: true,
      }
      if (isDev) {
        extensions.originalError = {
          message: error.originalError.message,
          stack: error.originalError.stack,
        }
      }
      return createGraphQLError(message, {
        nodes: error.nodes,
        source: error.source,
        positions: error.positions,
        path: error.path,
        extensions,
      })
    }
    return error
  }

  return createGraphQLError(message, {
    extensions: {
      unexpected: true,
      originalError: isDev
        ? error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
            }
          : error
        : undefined,
    },
  })
}
