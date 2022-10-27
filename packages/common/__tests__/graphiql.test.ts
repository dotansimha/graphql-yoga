import { AfterValidateHook } from '@envelop/core'
import { GraphQLError } from 'graphql'
import { Plugin } from '../src/plugins/types'
import { createServer } from '../src/server'

describe('GraphiQL', () => {
  describe('when received an option factory that returns Promise', () => {
    it('should respect graphiql option', async () => {
      const yoga = createServer({
        graphiql: () => Promise.resolve({ title: 'Test GraphiQL' }),
      })
      const response = await yoga.fetch('http://localhost:3000/graphql', {
        method: 'GET',
        headers: {
          Accept: 'text/html',
        },
      })
      expect(response.headers.get('content-type')).toEqual('text/html')
      const result = await response.text()
      expect(result).toMatch(/<title>Test GraphiQL<\/title>/)
    })

    it('returns error when graphiql is disabled', async () => {
      const yoga = createServer({
        graphiql: () => Promise.resolve(false),
      })
      const response = await yoga.fetch('http://localhost:3000/graphql', {
        method: 'GET',
        headers: {
          Accept: 'text/html',
        },
      })
      expect(response.headers.get('content-type')).toEqual('application/json')
      expect(response.status).toEqual(400)
    })
  })
})
