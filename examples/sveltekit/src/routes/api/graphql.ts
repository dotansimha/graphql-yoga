import { useGraphQlJit } from '@envelop/graphql-jit';
import { createServer } from '@graphql-yoga/common';
import type { RequestEvent } from '@sveltejs/kit/types/private';

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
		endpoint: '/api/graphql'
	},
});

export { yogaApp as get, yogaApp as post };
