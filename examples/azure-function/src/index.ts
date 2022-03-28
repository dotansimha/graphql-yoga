import { AzureFunction, Context, HttpRequest } from '@azure/functions'
import { createServer } from '@graphql-yoga/common'
import { Request } from 'cross-undici-fetch'

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
): Promise<void> {
  const app = createServer({
    logging: {
      debug: context.log.verbose,
      error: context.log.error,
      info: context.log.info,
      warn: context.log.warn,
    },
    graphiql: {
      endpoint: '/api/yoga',
    },
  })
  context.log('HTTP trigger function processed a request.')

  try {
    const request = new Request(req.url, {
      method: req.method,
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
