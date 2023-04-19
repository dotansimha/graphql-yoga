import { AzureFunction, Context, HttpRequest } from '@azure/functions'
import { createYoga, createSchema } from 'graphql-yoga'

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
): Promise<void> {
  const app = createYoga({
    logging: {
      debug: context.log.verbose,
      error: context.log.error,
      info: context.log.info,
      warn: context.log.warn,
    },
    graphqlEndpoint: '/api/yoga',
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
  context.log('HTTP trigger function processed a request.')

  const response = await app.fetch(req.url, {
    method: req.method?.toString(),
    body: req.rawBody,
    headers: req.headers,
  })

  const headersObj = Object.fromEntries(response.headers.entries())

  context.log('GraphQL Yoga response headers:', headersObj)

  const responseText = await response.text()
  context.log('GraphQL Yoga response text:', responseText)

  context.res = {
    status: response.status,
    body: responseText,
    headers: headersObj,
  }
}

export default httpTrigger
