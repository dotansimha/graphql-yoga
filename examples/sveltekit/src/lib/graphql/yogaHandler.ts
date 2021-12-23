import type { Server } from '@graphql-yoga/core';
import type { ResponseHeaders } from '@sveltejs/kit/types/helper';
import type { ServerRequest, ServerResponse } from '@sveltejs/kit/types/hooks';

export async function yogaHandler(
	req: ServerRequest,
	graphQLServer: Server<unknown>
): Promise<ServerResponse> {
	const request = new Request(`http://${req.host}/${req.path}`, {
		method: req.method,
		headers: req.headers,
		body: req.rawBody
	});

	const logLevel = process.env.LOG_LEVEL || '';
	graphQLServer.logger = {
		log: logLevel.includes('log') ? console.log : () => {},
		debug: logLevel.includes('debug') ? console.debug : () => {},
		warn: console.warn,
		info: console.info,
		error: console.error
	};

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
