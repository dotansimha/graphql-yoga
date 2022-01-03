import type { Server } from '@graphql-yoga/core';
import type { ResponseHeaders } from '@sveltejs/kit/types/helper';
import type { ServerRequest, ServerResponse } from '@sveltejs/kit/types/hooks';

export async function yogaHandler(
	req: ServerRequest,
	graphQLServer: Server<unknown>
): Promise<ServerResponse> {
	const request = new Request(`http://${req.url.host}/${req.url.pathname}`, {
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
