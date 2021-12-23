import { yogaHandler } from '$lib/graphql/yogaHandler';
import { createServer } from '@graphql-yoga/core';
import type { ServerRequest } from '@sveltejs/kit/types/hooks';

const defaultQuery = `query GetHello {
  hello
}
`;

const graphQLServer = createServer({
	typeDefs: `type Query`, //Just to not be empty, but will query the real endpoint
	graphiql: {
		endpoint: '/api/graphql',
		defaultQuery
	}
});

export async function get(req: ServerRequest) {
	return yogaHandler(req, graphQLServer);
}
