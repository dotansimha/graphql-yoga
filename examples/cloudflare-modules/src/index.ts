// src/index.mjs
import { createServer } from '@graphql-yoga/common'

const yoga = createServer()

export default {
  fetch: yoga.handleRequest,
}
