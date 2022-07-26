import { Maybe } from '@envelop/core'
import { createGraphQLError } from '@graphql-tools/utils'
import {
  OperationDefinitionNode,
  getOperationAST,
  GraphQLError,
  DocumentNode,
} from 'graphql'
import { YogaInitialContext } from '../../types'
import { Plugin } from '../types'

export function assertMutationViaGet(
  method: string,
  document: Maybe<DocumentNode>,
  operationName?: string,
) {
  const operation: OperationDefinitionNode | undefined = document
    ? getOperationAST(document, operationName) ?? undefined
    : undefined

  if (!operation) {
    throw createGraphQLError('Could not determine what operation to execute.', {
      extensions: {
        http: {
          status: 400,
        },
      },
    })
  }

  if (operation.operation === 'mutation' && method === 'GET') {
    throw createGraphQLError(
      'Can only perform a mutation operation from a POST request.',
      {
        extensions: {
          http: {
            status: 405,
            headers: {
              Allow: 'POST',
            },
          },
        },
      },
    )
  }
}

export function usePreventMutationViaGET(): Plugin<YogaInitialContext> {
  return {
    onParse() {
      // We should improve this by getting Yoga stuff from the hook params directly instead of the context
      return ({ result, context: { request, operationName } }) => {
        if (result instanceof Error) {
          if (result instanceof GraphQLError) {
            result.extensions.http = {
              status: 400,
            }
          }
          throw result
        }

        assertMutationViaGet(request.method, result, operationName)
      }
    },
  }
}
