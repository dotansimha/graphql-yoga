import { createGraphQLError } from '@graphql-tools/utils'
import { isGraphQLError } from '@envelop/core'
import { GraphQLErrorExtensions } from 'graphql'

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
        // @ts-expect-error it is a graphql Error based on our check its just we do not have sufficient types to prove it
        ...error.extensions,
        http: {
          status: 500,
          // @ts-expect-error it is a graphql Error based on our check its just we do not have sufficient types to prove it
          ...error.extensions?.http,
        },
      }
      if (dev) {
        extensions.originalError = {
          message: error.originalError.message,
          stack: error.originalError.stack,
        }
      }
      return createGraphQLError(message, {
        // @ts-expect-error it is a graphql Error based on our check its just we do not have sufficient types to prove it
        nodes: error.nodes,
        // @ts-expect-error it is a graphql Error based on our check its just we do not have sufficient types to prove it
        source: error.source,
        // @ts-expect-error it is a graphql Error based on our check its just we do not have sufficient types to prove it
        positions: error.positions,
        // @ts-expect-error it is a graphql Error based on our check its just we do not have sufficient types to prove it
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
