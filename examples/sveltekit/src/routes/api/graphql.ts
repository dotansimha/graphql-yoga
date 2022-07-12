import { useGraphQlJit } from '@envelop/graphql-jit';
import { createServer } from '@graphql-yoga/common';
import type { RequestEvent } from '@sveltejs/kit';

const yogaApp = createServer<RequestEvent>({
	logging: false,
	schema: {
		typeDefs: `
			type Query {
				hello: String
			}
		`,
		resolvers: {
			Query: {
				hello: () => 'SvelteKit - GraphQL Yoga'
			}
		}
	},
	plugins: [
		useGraphQlJit()
		// other plugins: https://www.envelop.dev/plugins
	],
	graphiql: {
		endpoint: '/api/graphql',
		defaultQuery: `query Hello {
	hello
}`
	}
});

export async function get(event: RequestEvent) {
	return yogaApp.handleRequest(event.request, event);
}

export async function post(event: RequestEvent) {
	return yogaApp.handleRequest(event.request, event);
}
