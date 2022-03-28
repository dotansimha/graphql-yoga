import { createServer } from '../src'

describe('CreateServer', () => {
  it('Yoga accepts graphiql option in different formats', async () => {
    const lazy = () => {
      const graphiqlOptionAsFalse = createServer({
        graphiql: false,
      })

      const graphiqlOptionAsTrue = createServer({
        // @ts-expect-error This is not allowed:
        graphiql: true,
      })

      const graphiqlOptionAsOptions = createServer({
        graphiql: {},
      })

      const graphiqlOptionAsFunction = createServer({
        graphiql: () => ({}),
      })

      return {
        graphiqlOptionAsFunction,
        graphiqlOptionAsOptions,
        graphiqlOptionAsTrue,
        graphiqlOptionAsFalse,
      }
    }

    // The test doesn't really assert anything; it just type checks
    expect(lazy).toBeTruthy()
  })
})
