import { formatError } from 'graphql'
import { GraphQLFormattedError } from 'graphql/error/formatError'

export interface PrismaErrorProps {
  code?: number
  requestId?: string
}

export function defaultErrorFormatter(
  error,
): GraphQLFormattedError & PrismaErrorProps {
  const data: GraphQLFormattedError & PrismaErrorProps = formatError(error)

  if (
    error.originalError &&
    error.originalError.result &&
    error.originalError.result.errors &&
    error.originalError.result.errors.length === 1
  ) {
    const originalError = error.originalError.result.errors[0]
    if (originalError.message === error.message) {
      if (originalError.code) {
        data.code = originalError.code
      }
      if (originalError.requestId) {
        data.requestId = originalError.requestId
      }
    }
  }

  return data
}
