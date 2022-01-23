import { renderGraphiQL } from '@graphql-yoga/common';

const defaultQuery = `query GetHello {
  hello
}
`;

export async function get() {
	return {
		status: 200,
		headers: new Headers({ 'content-type': 'text/html' }),
		body: renderGraphiQL({
			endpoint: '/api/graphql',
			defaultQuery
		})
	};
}
