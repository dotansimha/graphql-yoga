import { yoga } from '../src/yoga'

describe('node-ts example integration', () => {
  it('should execute query', async () => {
    const response = await yoga.fetch('/graphql?query={hello}')

    expect(response.status).toBe(200)
    expect(await response.text()).toMatchInlineSnapshot(
      `"{"data":{"hello":"world"}}"`,
    )
  })

  it('should have subscriptions disabled', async () => {
    const response = await yoga.fetch(
      '/graphql?query=subscription{greetings}',
      {
        headers: {
          Accept: 'text/event-stream',
        },
      },
    )

    expect(response.status).toBe(400)
    expect(await response.text()).toMatchInlineSnapshot(`
      "data: {"errors":[{"message":"Subscriptions have been disabled"}]}

      "
    `)
  })
})
