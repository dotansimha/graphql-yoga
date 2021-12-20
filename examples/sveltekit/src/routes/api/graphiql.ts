import { yogaHandler } from '$lib/graphql/yogaHandler';
import { BaseGraphQLServer } from '@graphql-yoga/core';
import type { ServerRequest } from '@sveltejs/kit/types/hooks';

const defaultQuery = `query GetHello {
  hello
}
`;

const graphQLServer = new BaseGraphQLServer({
	typeDefs: ``,
	graphiql: {
		endpoint: '/api/graphql',
		defaultQuery
	}
});

export async function get(req: ServerRequest) {
	return yogaHandler(req, graphQLServer);
}
