import { useGraphQlJit } from '@envelop/graphql-jit';
import { createServer } from '@graphql-yoga/common';
import type { RequestEvent } from '@sveltejs/kit/types/hooks';

export async function get() {
	return {
		status: 302,
		headers: { Location: '/' }
	};
}

const yogaApp = createServer({
	logging: false,
	maskedErrors: process.env.NODE_ENV === 'development',
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
	]
});

export async function post(event: RequestEvent) {
	const response: Response = await yogaApp.handleRequest(event.request);
	return {
		status: response.status,
		headers: new Headers(response.headers),
		body: await response.json()
	};
}
