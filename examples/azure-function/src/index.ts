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

  try {
    const response = await app.fetch(req.url, {
      method: req.method?.toString(),
      body: req.rawBody,
      headers: req.headers,
    })
    const response = await app.handleRequest(request, context)
    const responseText = await response.text()
    context.log('GraphQL Yoga response text:', responseText)

    const headersObj = {}
    response.headers.forEach((value, key) => {
      headersObj[key] = value
    })

    context.log('GraphQL Yoga response headers:', headersObj)
    context.res = {
      status: response.status,
      body: responseText,
      headers: headersObj,
    }
  } catch (e) {
    context.log.error('Error:', e)
    context.res = {
      status: 500,
      body: e.message,
    }
  }
}

export default httpTrigger
