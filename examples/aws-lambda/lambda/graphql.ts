import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { createSchema, createYoga } from 'graphql-yoga';

const yoga = createYoga<{
  event: APIGatewayEvent;
  lambdaContext: Context;
}>({
  graphqlEndpoint: '/graphql',
  landingPage: false,
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        greetings: String
      }
    `,
    resolvers: {
      Query: {
        greetings: () => 'This is the `greetings` field of the root `Query` type',
      },
    },
  }),
});

export async function handler(
  event: APIGatewayEvent,
  lambdaContext: Context,
): Promise<APIGatewayProxyResult> {
  const response = await yoga.fetch(
    event.path +
      '?' +
      new URLSearchParams((event.queryStringParameters as Record<string, string>) || {}).toString(),
    {
      method: event.httpMethod,
      headers: event.headers as HeadersInit,
      body: event.body
        ? Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8')
        : undefined,
    },
    {
      event,
      lambdaContext,
    },
  );

  const responseHeaders = Object.fromEntries(response.headers.entries());

  return {
    statusCode: response.status,
    headers: responseHeaders,
    body: await response.text(),
    isBase64Encoded: false,
  };
}
