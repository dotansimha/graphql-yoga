import { useGraphQlJit } from '@envelop/graphql-jit';
import { createYoga } from 'graphql-yoga';
import { createSchema } from 'graphql-yoga/schema';
import type { RequestEvent } from '@sveltejs/kit';

const yogaApp = createYoga<RequestEvent>({
	logging: false,
	schema: createSchema({
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
	}),
	plugins: [
		useGraphQlJit()
		// other plugins: https://www.envelop.dev/plugins
	],
	graphqlEndpoint: '/api/graphql',
	graphiql: {
		defaultQuery: `query Hello {
	hello
}`
	}
});

export { yogaApp as get, yogaApp as post };
