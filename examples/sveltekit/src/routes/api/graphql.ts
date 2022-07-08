import { useGraphQlJit } from '@envelop/graphql-jit';
import { createYoga } from 'graphql-yoga';
import type { RequestEvent } from '@sveltejs/kit';

const yogaApp = createYoga<RequestEvent>({
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

export { yogaApp as get, yogaApp as post };
