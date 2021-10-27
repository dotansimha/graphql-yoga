import type { FastifyRequest } from 'fastify'
import type { Request } from '@graphql-yoga/handler'

/**
 * Helper function to create a GraphQL Helix request object.
 */
export async function getHttpRequest(req: FastifyRequest): Promise<Request> {
  return {
    body: req.body,
    headers: req.headers,
    method: req.method,
    query: req.query,
  }
}
