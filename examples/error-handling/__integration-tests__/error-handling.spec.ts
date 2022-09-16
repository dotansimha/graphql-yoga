import { yoga } from '../src'
import { createServer, Server } from 'http'
import { fetch } from '@whatwg-node/fetch'
import getPort from 'get-port'

describe('error-handling example integration', () => {
  it('should get a masked error', async () => {
    const port = await getPort()
    const server = createServer(yoga)
    try {
      await new Promise<void>((resolve) => server.listen(port, resolve))
      const response = await fetch(
        `http://localhost:${port}/graphql?query=query{greeting}`,
      )
      const body = await response.json()
      expect(body.errors).toBeDefined()
      expect(body.errors[0].message).toEqual('Unexpected error.')
      expect(body.data).toBeNull()
    } finally {
      await new Promise((resolve) => server.close(resolve))
    }
  })

  it('should get a custom error', async () => {
    const port = await getPort()
    const server = createServer(yoga)
    try {
      const response = await fetch(
        `http://localhost:${port}/graphql?query=query{user(byId: "6"){id}}`,
      )
      const body = await response.json()
      expect(body.errors).toBeDefined()
      expect(body.errors).toMatchInlineSnapshot(`
        [
          {
            "extensions": {
              "code": "USER_NOT_FOUND",
              "someRandomExtensions": {
                "aaaa": 3,
              },
            },
            "locations": [
              {
                "column": 7,
                "line": 1,
              },
            ],
            "message": "User with id '6' not found.",
            "path": [
              "user",
            ],
          },
        ]
        `)
      expect(body.data).toBeNull()
    } finally {
      await new Promise((resolve) => server.close(resolve))
    }
  })
})
