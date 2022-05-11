import { EnvelopError } from '@envelop/core'
import { GraphQLError } from 'graphql'

export type GraphQLYogaErrorExtensions = Record<string, any> & {
  status?: number
  headers?: Record<string, string>
  errors?: readonly GraphQLError[]
}

const GraphQLYogaErrorCtor = EnvelopError as {
  new (
    message: string,
    extensions?: GraphQLYogaErrorExtensions,
  ): GraphQLYogaError
}

interface GraphQLYogaError {
  extensions?: GraphQLYogaErrorExtensions
}

export { GraphQLYogaErrorCtor as GraphQLYogaError }
