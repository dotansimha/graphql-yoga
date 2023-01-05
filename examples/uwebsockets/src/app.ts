import { App, HttpRequest, HttpResponse } from 'uWebSockets.js'
import { createSchema, createYoga } from 'graphql-yoga'
import { Readable } from 'node:stream'

interface ServerContext {
  req: HttpRequest
  res: HttpResponse
}

export const yoga = createYoga<ServerContext>({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        hello: String!
      }
    `,
    resolvers: {
      Query: {
        hello: () => 'Hello world!',
      },
    },
  }),
})

export const app = App().any('/*', async (res, req) => {
  let body: any
  const method = req.getMethod()
  if (method !== 'get' && method !== 'head') {
    body = new Readable({
      read() {},
    })
    res
      .onData(function (chunk, isLast) {
        body.push(Buffer.from(chunk))
        if (isLast) {
          body.push(null)
        }
      })
      .onAborted(function () {
        body.push(null)
      })
  }
  const headers = {}
  req.forEach((key, value) => {
    headers[key] = value
  })
  const response = await yoga.fetch(
    req.getUrl(),
    {
      method,
      headers,
      body,
    },
    {
      req,
      res,
    },
  )
  res.writeStatus(`${response.status} ${response.statusText}`)
  response.headers.forEach((value, key) => {
    // content-length causes an error with Node.js's fetch
    if (key === 'content-length') {
      return
    }
    res.writeHeader(key, value)
  })
  if (response.body) {
    if (response.body instanceof Uint8Array) {
      res.end(response.body)
      return
    }
    for await (const chunk of response.body) {
      res.write(chunk)
    }
  }
  res.end()
})
