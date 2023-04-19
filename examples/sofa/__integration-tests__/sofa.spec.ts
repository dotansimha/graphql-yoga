import { yoga } from '../src/yoga.js'

describe('SOFA', () => {
  it('serve Swagger UI correctly', async () => {
    const response = await yoga.fetch('http://localhost:4000/swagger')
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/html')
    const html = await response.text()
    expect(html).toContain('<title>SwaggerUI</title>')
  })
  it('serve Swagger JSON correctly', async () => {
    const response = await yoga.fetch('http://localhost:4000/swagger.json')
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    const json = await response.json()
    expect(json).toMatchSnapshot('sofa-swagger')
  })
  it('serve GraphiQL correctly', async () => {
    const response = await yoga.fetch('http://localhost:4000/graphql', {
      method: 'GET',
      headers: {
        Accept: 'text/html',
      },
    })
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/html')
    const html = await response.text()
    expect(html).toContain('<title>Yoga GraphiQL</title>')
  })
  it('serve GraphQL API correctly', async () => {
    const response = await yoga.fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query {
            users {
              id
              name
            }
          }
        `,
      }),
    })
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json).toMatchSnapshot('sofa-graphql')
  })
  it('serve REST API correctly', async () => {
    const response = await yoga.fetch('http://localhost:4000/rest/me')
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    const json = await response.json()
    expect(json).toMatchSnapshot('sofa-rest-me')
  })
})
