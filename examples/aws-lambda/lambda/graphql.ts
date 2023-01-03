import { createYoga, createSchema } from 'graphql-yoga'
import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda'

const yoga = createYoga<{
  event: APIGatewayEvent
  lambdaContext: Context
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
        greetings: () =>
          'This is the `greetings` field of the root `Query` type',
      },
    },
  }),
})

export async function handler(
  event: APIGatewayEvent,
  lambdaContext: Context,
): Promise<APIGatewayProxyResult> {
  let fullPath = event.path

  if (event.queryStringParameters != null) {
    fullPath +=
      '?' +
      new URLSearchParams(event.queryStringParameters as Record<string, string>)
  }

  const response = await yoga.fetch(
    fullPath,
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
  )

  const responseHeaders: Record<string, string> = {}

  response.headers.forEach((value, name) => {
    responseHeaders[name] = value
  })

  return {
    statusCode: response.status,
    headers: responseHeaders,
    body: await response.text(),
    isBase64Encoded: false,
  }
}
