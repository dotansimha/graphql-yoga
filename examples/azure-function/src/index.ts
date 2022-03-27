import { AzureFunction, Context, HttpRequest } from '@azure/functions'
import { createServer } from '@graphql-yoga/common'

const app = createServer({})

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
): Promise<void> {
  console.log('HTTP trigger function processed a request.')
  context.log('HTTP trigger function processed a request.')

  try {
    const request = new Request(req.url, {
      method: req.method,
      body: req.rawBody,
      headers: req.headers,
    })

    const response = await app.handleRequest(request)
    const responseText = response.text()
    context.log('GraphQL Yoga response:', responseText)

    context.res = {
      status: response.status,
      body: responseText,
      headers: Object.keys(response.headers).reduce((prev, key) => {
        prev[key] = response.headers.get(key)

        return prev
      }, {}),
    }
  } catch (e) {
    console.error('Error:', e)
    context.log.error('Error:', e)
    context.res = {
      status: 500,
      body: e.message,
    }
  }
}

export default httpTrigger
