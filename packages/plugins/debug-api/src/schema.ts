import { DocumentNode, ExecutionResult, print } from 'graphql'
import { DateTimeResolver } from 'graphql-scalars'
import { createSchema } from 'graphql-yoga'

export type ExecutedOperation = {
  id: string
  document: DocumentNode
  request: Request
  startTime: Date
  variables: Record<string, unknown>

  endTime?: Date
  result?: ExecutionResult
  response?: Response
}

export type ExecutedOperationsStore = ExecutedOperation[]

export type Context = {
  operationsStore: ExecutedOperationsStore
}

export const schema = createSchema<Context>({
  typeDefs: /* GraphQL */ `
    scalar DateTime

    type Query {
      executedOperations: [ExecutedOperation!]!
    }

    type ExecutedOperation {
      id: ID!
      document: String!
      variables: String!
      startTime: DateTime!
      endTime: DateTime
      result: String

      request: Request!
      response: Response
    }

    type Request {
      path: String!
      headers: [Header!]!
    }

    type Response {
      status: Int!
      headers: [Header!]!
    }

    type Header {
      key: String!
      value: String!
    }
  `,
  resolvers: {
    DateTime: DateTimeResolver,
    Query: {
      executedOperations: (_, args, context) => context.operationsStore,
    },
    ExecutedOperation: {
      document: (operation: ExecutedOperation) => print(operation.document),
      variables: (operation: ExecutedOperation) =>
        JSON.stringify(operation.variables, null, 2),
      result: (operation: ExecutedOperation) =>
        JSON.stringify(operation.result, null, 2),
      startTime: (operation: ExecutedOperation) => operation.startTime,
      endTime: (operation: ExecutedOperation) => operation.endTime,
      request: (operation: ExecutedOperation) => {
        return {
          path: operation.request.url,
          headers: Object.entries(operation.request.headers).map((pair) => ({
            key: pair[0],
            value: pair[1],
          })),
        }
      },
      response: (operation: ExecutedOperation) => {
        if (!operation.response) {
          return null
        }

        return {
          status: operation.response.status,
          headers: Object.entries(operation.response.headers).map((pair) => ({
            key: pair[0],
            value: pair[1],
          })),
        }
      },
    },
  },
})
