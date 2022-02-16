import { useGraphQlJit } from '@envelop/graphql-jit';
import { createServer } from '@graphql-yoga/common';
import type { RequestEvent } from '@sveltejs/kit/types/hooks';

const yogaApp = createServer({
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
		endpoint: '/api/graphql'
	}
});

async function requestEventHandler(event: RequestEvent) {
	const response = await yogaApp.handleRequest(event.request);

	return {
		status: response.status,
		headers: new Headers(response.headers),
		body: await response.text()
	};
}

export { requestEventHandler as get, requestEventHandler as post };
