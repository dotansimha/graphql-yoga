import { GraphQLErrorExtensions } from '@graphql-tools/graphql'
import { isGraphQLError } from '../error.js'
import { GraphQLError } from '@graphql-tools/graphql'

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
      const extensions: GraphQLErrorExtensions = {
        ...error.extensions,
        http: {
          status: 500,
          ...error.extensions?.http,
        },
      }
      if (dev) {
        extensions.originalError = {
          message: error.originalError.message,
          stack: error.originalError.stack,
        }
      }
      return new GraphQLError(message, {
        nodes: error.nodes,
        source: error.source,
        positions: error.positions,
        path: error.path,
        extensions,
      })
    }
    return error
  }

  return new GraphQLError(message, {
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
