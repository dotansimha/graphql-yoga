import {
  GraphQLError,
  GraphQLSchema,
  DocumentNode,
  getOperationAST,
  print,
  Kind,
  ExecutionResult,
} from '@graphql-tools/graphql'
import { envelop, isAsyncIterable, useEngine, useSchema } from '@envelop/core'
import * as GraphQLEngine from '@graphql-tools/graphql'

function isDocumentNode(object: any): object is DocumentNode {
  return (
    object &&
    typeof object === 'object' &&
    'kind' in object &&
    object.kind === Kind.DOCUMENT
  )
}

type MaybePromise<T> = T | Promise<T>
type MaybeAsyncIterableIterator<T> = T | AsyncIterableIterator<T>
type ExecutionReturn = MaybeAsyncIterableIterator<ExecutionResult>

type TestkitInstance = {
  execute: (
    operation: DocumentNode | string,
    variables?: Record<string, any>,
    initialContext?: any,
  ) => MaybePromise<ExecutionResult>
  wait: (ms: number) => Promise<void>
}

export function createEnvelopTestkit(
  plugins: Parameters<typeof envelop>['0']['plugins'],
  schema?: GraphQLSchema,
): TestkitInstance {
  const toGraphQLErrorOrThrow = (thrownThing: unknown): GraphQLError => {
    if (thrownThing instanceof GraphQLError) {
      return thrownThing
    }

    throw thrownThing
  }

  //   const phasesReplacements: PhaseReplacementParams[] = []
  const getEnveloped = envelop({
    plugins: [...[useEngine(GraphQLEngine), useSchema(schema)], ...plugins],
  })

  return {
    wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    execute: async (operation, variableValues = {}, initialContext = {}) => {
      const proxy = getEnveloped(initialContext)

      let document: DocumentNode
      try {
        document = isDocumentNode(operation)
          ? operation
          : proxy.parse(operation)
      } catch (err: unknown) {
        return {
          errors: [toGraphQLErrorOrThrow(err)],
        }
      }

      let validationErrors: ReadonlyArray<GraphQLError>
      try {
        validationErrors = proxy.validate(proxy.schema, document)
      } catch (err: unknown) {
        return {
          errors: [toGraphQLErrorOrThrow(err)],
        }
      }

      if (validationErrors.length > 0) {
        return {
          errors: validationErrors,
        }
      }

      const mainOperation = getOperationAST(document)

      if (mainOperation == null) {
        return {
          errors: [new GraphQLError('Could not identify main operation.')],
        }
      }

      const contextValue = await proxy.contextFactory({
        request: {
          headers: {},
          method: 'POST',
          query: '',
          body: {
            query: print(document),
            variables: variableValues,
          },
        },
        document,
        operation: print(document),
        variables: variableValues,
        ...initialContext,
      })

      if (mainOperation.operation === 'subscription') {
        return proxy.subscribe({
          variableValues,
          contextValue,
          schema: proxy.schema,
          document,
          rootValue: {},
        })
      }

      return proxy.execute({
        variableValues,
        contextValue,
        schema: proxy.schema,
        document,
        rootValue: {},
      })
    },
  }
}

export function assertSingleExecutionValue(
  input: ExecutionReturn,
): asserts input is ExecutionResult {
  if (isAsyncIterable(input)) {
    throw new Error('Received stream but expected single result')
  }
}
