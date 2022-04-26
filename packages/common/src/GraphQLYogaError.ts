import { EnvelopError } from '@envelop/core'
import { GraphQLError } from 'graphql'

export type GraphQLYogaErrorExtensions = Record<string, any> & {
  status?: number
  headers?: Record<string, string>
  errors?: readonly GraphQLError[]
}

export class GraphQLYogaError extends EnvelopError {
  public extensions: GraphQLYogaErrorExtensions
  constructor(message: string, extensions?: GraphQLYogaErrorExtensions) {
    super(message, extensions)
    this.extensions = extensions || {}
  }
}
