import { EnvelopError } from '@envelop/core'
import { GraphQLError } from 'graphql'

declare module 'graphql' {
  export interface GraphQLErrorExtensions {
    status?: number
    headers?: Record<string, string>
    originalErrors?: readonly GraphQLError[]
  }
}

export { EnvelopError as GraphQLYogaError }
