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

    expect(res.ok).toBeTruthy()

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

    expect(res.ok).toBeTruthy()

    await expect(res.json()).resolves.toMatchInlineSnapshot(`
      {
        "data": {
          "dontChange": "didntChange",
        },
      }
    `)
  })

  it.todo('should subscribe and stream')
})
