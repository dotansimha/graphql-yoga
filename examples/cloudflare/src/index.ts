// src/index.mjs
import { createServer } from '@graphql-yoga/common'

const yoga = createServer()

export default {
  async fetch(request: Request) {
    const response = await yoga.handleRequest(request)
    return response
  },
}
