import { startApp } from '../src/app.js'
import { fetch } from '@whatwg-node/fetch'

describe('hapi example integration', () => {
  const port = 4000
  let stop = () => {
    // noop
  }
  beforeAll(async () => {
    stop = await startApp(4000)
  })
  afterAll(() => stop())

  it('should execute query', async () => {
    const res = await fetch(`http://localhost:${port}/graphql`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{ hello }' }),
    })

    await expect(res.json()).resolves.toMatchInlineSnapshot(`
      {
        "data": {
          "hello": "world",
        },
      }
    `)
  })

  it('should execute mutation', async () => {
    const res = await fetch(`http://localhost:${port}/graphql`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: 'mutation { dontChange }' }),
    })

    await expect(res.json()).resolves.toMatchInlineSnapshot(`
      {
        "data": {
          "dontChange": "didntChange",
        },
      }
    `)
  })

  it('should subscribe and stream', async () => {
    const res = await fetch(`http://localhost:${port}/graphql`, {
      method: 'POST',
      headers: {
        accept: 'text/event-stream',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: 'subscription { greetings }' }),
    })

    await expect(res.text()).resolves.toMatchInlineSnapshot(`
      "event: next
      data: {"data":{"greetings":"Hi"}}

      event: next
      data: {"data":{"greetings":"Bonjour"}}

      event: next
      data: {"data":{"greetings":"Hola"}}

      event: next
      data: {"data":{"greetings":"Ciao"}}

      event: next
      data: {"data":{"greetings":"Zdravo"}}

      event: complete

      "
    `)
  })
})
