import { useGraphQlJit } from '@envelop/graphql-jit';
import { createYoga, createSchema } from 'graphql-yoga';
import type { RequestEvent } from '@sveltejs/kit';
import { renderGraphiQL } from '@graphql-yoga/render-graphiql';

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
	renderGraphiQL,
	graphiql: {
		defaultQuery: `query Hello {
	hello
}`
	},
	fetchAPI: globalThis
});

export { yogaApp as GET, yogaApp as POST };
