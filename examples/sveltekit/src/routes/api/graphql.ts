import { yogaHandler } from '$lib/graphql/yogaHandler';
import { createServer } from '@graphql-yoga/core';
import type { ServerRequest } from '@sveltejs/kit/types/hooks';

export async function get() {
	return {
		status: 302,
		headers: { Location: '/' }
	};
}

const yogaApp = createServer({
	typeDefs: `
		type Query {
			hello: String
		}
	`,
	resolvers: {
		Query: {
			hello: () => 'GraphQL Yoga - SvelteKit'
		}
	}
});

export async function post(req: ServerRequest) {
	return yogaHandler(req, yogaApp);
}
