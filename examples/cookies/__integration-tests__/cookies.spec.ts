import { app } from '../src/app'

describe('Cookies', () => {
  it('reads existing cookies', async () => {
    const res = await app.fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'foo=bar',
      },
      body: JSON.stringify({ query: '{ cookie(name: "foo") }' }),
    })

    const result = await res.json()

    expect(result).toMatchObject({
      data: {
        cookie: 'bar',
      },
    })
  })
  it('sets cookies', async () => {
    const res = await app.fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        query: 'mutation { setCookie(name: "foo", value: "bar") }',
      }),
    })

    const result = await res.json()

    expect(result).toMatchObject({
      data: {
        setCookie: 'bar',
      },
    })
    expect(res.headers.get('set-cookie')).toContain('foo=bar')
  })
})
