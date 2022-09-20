import { createGraphQLError } from '@graphql-tools/utils'
import { isGraphQLError } from '@envelop/core'

export const yogaDefaultFormatError = ({
  error,
  message,
  isDev,
}: {
  error: unknown
  message: string
  isDev?: boolean
}) => {
  const dev = isDev || globalThis.process?.env?.NODE_ENV === 'development'

  if (isGraphQLError(error)) {
    if (error.originalError) {
      if (error.originalError.name === 'GraphQLError') {
        return error
      }
      // Original error should be removed
      const extensions = {
        // @ts-ignore
        ...error.extensions,
      }
      if (dev) {
        extensions.originalError = {
          message: error.originalError.message,
          stack: error.originalError.stack,
        }
      }
      return createGraphQLError(message, {
        // @ts-ignore
        nodes: error.nodes,
        // @ts-ignore
        source: error.source,
        // @ts-ignore
        positions: error.positions,
        // @ts-ignore
        path: error.path,
        extensions,
      })
    }
    return error
  }

  return createGraphQLError(message, {
    extensions: {
      http: {
        status: 500,
      },
      originalError: dev
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
