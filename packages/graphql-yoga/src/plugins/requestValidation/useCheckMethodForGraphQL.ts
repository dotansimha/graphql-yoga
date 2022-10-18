import { GraphQLError } from '@graphql-tools/graphql'
import { Plugin } from '../types'

export function isValidMethodForGraphQL(
  method: string,
): method is 'GET' | 'POST' {
  return method === 'GET' || method === 'POST'
}

export function useCheckMethodForGraphQL(): Plugin {
  return {
    onRequest({ request }) {
      if (!isValidMethodForGraphQL(request.method)) {
        throw new GraphQLError('GraphQL only supports GET and POST requests.', {
          extensions: {
            http: {
              status: 405,
              headers: {
                Allow: 'GET, POST',
              },
            },
          },
        })
      }
    },
  }
}
