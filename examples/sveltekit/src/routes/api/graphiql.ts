import { renderGraphiQL } from '@graphql-yoga/core';
import type { ServerRequest } from '@sveltejs/kit/types/hooks';

const defaultQuery = `query GetHello {
  hello
}
`;

export async function get(req: ServerRequest) {
	return {
		status: 200,
		body: renderGraphiQL({
			endpoint: '/api/graphql',
			defaultQuery
		})
	};
}
