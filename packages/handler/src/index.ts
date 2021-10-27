import { processRequest, getGraphQLParameters } from 'graphql-helix'
import type { GraphQLSchema } from 'graphql'
import type { Request as HelixRequest } from 'graphql-helix'
import type { GetEnvelopedFn } from '@envelop/core'

export type Request = HelixRequest

export const handleRequest = async (
  request: Request,
  schema: GraphQLSchema,
  customEnvelop?: GetEnvelopedFn<any>,
) => {
  const graphqlParams = getGraphQLParameters(request)

  if (customEnvelop) {
    const proxy = customEnvelop({ request })
    return processRequest({
      request,
      ...graphqlParams,
      ...proxy,
    })
  }

  return processRequest({
    request,
    schema,
    ...graphqlParams,
  })
}
