import { yoga } from '../src/yoga'

describe('pothos example integration', () => {
  it('should query', async () => {
    const response = await yoga.fetch('http://yoga/graphql?query={hello}')

    expect(response.status).toBe(200)
    expect(await response.text()).toMatchInlineSnapshot(
      `"{"data":{"hello":"world"}}"`,
    )
  })

  it('should subscribe', async () => {
    const response = await yoga.fetch(
      'http://yoga/graphql?query=subscription{greetings}',
      {
        headers: {
          accept: 'text/event-stream',
        },
      },
    )

    expect(response.status).toBe(200)
    expect(await response.text()).toMatchInlineSnapshot(`
      "data: {"data":{"greetings":"Hi"}}

      data: {"data":{"greetings":"Bonjour"}}

      data: {"data":{"greetings":"Hola"}}

      data: {"data":{"greetings":"Ciao"}}

      data: {"data":{"greetings":"Zdravo"}}

      event: complete

      "
    `)
  })
})
