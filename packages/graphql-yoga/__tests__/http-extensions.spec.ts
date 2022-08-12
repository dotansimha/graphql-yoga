import { GraphQLError } from 'graphql'
import { createYoga } from 'graphql-yoga'

describe('GraphQLError.extensions.http', () => {
  it('sets correct status code and headers for thrown GraphQLError in plugins', async () => {
    const yoga = createYoga({
      plugins: [
        {
          onPrepare() {
            throw new GraphQLError('A', {
              extensions: {
                http: {
                  status: 401,
                  headers: {
                    'www-authenticate': 'Bearer',
                  },
                },
              },
            })
          },
        },
      ],
      logging: false,
    })

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ a }' }),
    })

    expect(response.status).toBe(401)
    expect(response.headers.get('www-authenticate')).toBe('Bearer')
  })
})
