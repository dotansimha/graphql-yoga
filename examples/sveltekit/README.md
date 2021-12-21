# GraphQL Yoga - SvelteKit

Step to use GraphQL Yoga & SvelteKit

## 0.1/ Install SvelteKit

[SvelteKit](https://kit.svelte.dev/)

```bash
npm init svelte@next
```

## 0.2/ Add GraphQL Yoga

[GraphQL Yoga - SvelteKit](https://graphql-yoga.vercel.app/docs/integrations/integration-with-sveltekit)

```bash
yarn add -D @graphql-yoga/core@0.3.0-canary-352ac0f.0
```

## 1/ Add the yogaHandler

Create the file `src/lib/graphql/yogaHandler.ts`:

```ts
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
```

## 2/ Create your graphql endpoint

Create the file `src/routes/api/graphql.ts`:

```ts
import { yogaHandler } from '$lib/graphql/yogaHandler';
import { BaseGraphQLServer } from '@graphql-yoga/core';
import type { ServerRequest } from '@sveltejs/kit/types/hooks';

export async function get() {
	return {
		status: 302,
		headers: { Location: '/' }
	};
}

const yogaApp = new BaseGraphQLServer({
	isDev: true,
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
	return yogaHandler(req, yogaApp);
}
```

## 3/ Create your graphiql page

Create the file `src/routes/api/graphiql.ts`:

```ts
import { yogaHandler } from '$lib/graphql/yogaHandler';
import { BaseGraphQLServer } from '@graphql-yoga/core';
import type { ServerRequest } from '@sveltejs/kit/types/hooks';

const defaultQuery = `query GetHello {
  hello
}
`;

const graphQLServer = new BaseGraphQLServer({
	typeDefs: ``,
	graphiql: {
		endpoint: '/api/graphql',
		defaultQuery
	}
});

export async function get(req: ServerRequest) {
	return yogaHandler(req, graphQLServer);
}
```

## 4.1/ Add a link to graphiql from home

```html
<a rel="external" href="/api/graphiql">GraphiQL</a>
```

## 4.2/ Start locally

```bash
yarn dev
```

Navigate to [http://localhost:3000](http://localhost:3000)
