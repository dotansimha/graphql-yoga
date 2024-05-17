/* eslint-disable @typescript-eslint/no-explicit-any */
import { pipeline, Writable } from 'node:stream';
import { promisify } from 'node:util';
import { APIGatewayEvent, Context } from 'aws-lambda';
import { createSchema, createYoga } from 'graphql-yoga';

declare const awslambda: any;

const pipeline$ = promisify(pipeline);

const yoga = createYoga<{
  event: APIGatewayEvent;
  lambdaContext: Context;
  responseStream: Writable;
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

export const handler = awslambda.streamifyResponse(async function handler(
  event: APIGatewayEvent,
  responseStream: Writable,
  lambdaContext: Context,
) {
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
      responseStream,
    },
  );

  responseStream = awslambda.HttpResponseStream.from(responseStream, {
    statusCode: response.status,
    headers: Object.fromEntries(response.headers.entries()),
  });

  if (response.body) {
    await pipeline$(response.body, responseStream);
  } else {
    responseStream.end();
  }
});
