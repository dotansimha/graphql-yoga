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
		// @ts-expect-error - TODO: fix this
		useGraphQlJit()
		// other plugins: https://www.envelop.dev/plugins
	],
	graphiql: {
		endpoint: '/api/graphql'
	}
});

function requestEventHandler(event: RequestEvent): Promise<Response> {
	return yogaApp.handleRequest(event.request);
}

export { requestEventHandler as get, requestEventHandler as post };
