import { createServer } from '@graphql-yoga/common';
import type { ResponseHeaders } from '@sveltejs/kit/types/helper';
import type { ServerRequest } from '@sveltejs/kit/types/hooks';

export async function get() {
	return {
		status: 302,
		headers: { Location: '/' }
	};
}

const graphQLServer = createServer({
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
	const request = new Request(req.url.toString(), {
		method: req.method,
		headers: req.headers,
		body: req.rawBody
	});
	const response: Response = await graphQLServer.handleRequest(request);

	const responseHeaders: ResponseHeaders = {};

	response.headers.forEach((value, key) => {
		responseHeaders[key] = value;
	});

	const responseBodyText = await response.text();

	return {
		status: response.status,
		headers: responseHeaders,
		body: responseBodyText
	};
}
