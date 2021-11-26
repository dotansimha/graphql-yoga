import { processRequest, getGraphQLParameters } from '@ardatan/graphql-helix'
import type { GraphQLSchema } from 'graphql'
import type { GetEnvelopedFn } from '@envelop/core'

export const handleRequest = async (
  request: Request,
  schema: GraphQLSchema,
  customEnvelop?: GetEnvelopedFn<any>,
) => {
  const graphqlParams = await getGraphQLParameters(request)

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
