import { createServer } from '@graphql-yoga/node'
import { Request, Response } from 'node-fetch'
import fetch from 'node-fetch'

const server = createServer({
  logging: false,
  hostname: '127.0.0.1',
  healthCheckPath: false,
  fetchAPI: {
    Request,
    Response,
    fetch,
  },
})

server.start()
