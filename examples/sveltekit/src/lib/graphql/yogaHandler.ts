import type { BaseGraphQLServer } from '@graphql-yoga/core';
import type { ResponseHeaders } from '@sveltejs/kit/types/helper';
import type { ServerRequest, ServerResponse } from '@sveltejs/kit/types/hooks';

export async function yogaHandler(
	req: ServerRequest,
	graphQLServer: BaseGraphQLServer<unknown>
): Promise<ServerResponse> {
	const request = new Request(`http://${req.host}/${req.path}`, {
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
