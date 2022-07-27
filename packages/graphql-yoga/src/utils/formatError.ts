import { FormatErrorHandler } from '@envelop/core'
import { GraphQLError } from 'graphql'

export const formatError: FormatErrorHandler = (err, message, isDev) => {
  if (err instanceof GraphQLError) {
    return err
  }
  return new GraphQLError(message)
}
