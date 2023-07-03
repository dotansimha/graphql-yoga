import { buildApp } from '../src/app.js'
import request from 'supertest'
import express from 'express'

describe('helmet', () => {
  const app = express()
  buildApp(app)

  it('should show GraphiQL', async () => {
    const response = await request(app)
      .get('/graphql')
      .set('Accept', 'text/html')
    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.headers['content-security-policy']).toContain(
      "script-src 'self' unpkg.com 'unsafe-inline'",
    )
    expect(response.headers['content-security-policy']).toContain(
      "style-src 'self' unpkg.com",
    )
    expect(response.headers['content-security-policy']).toContain(
      "img-src 'self' raw.githubusercontent.com",
    )
  })

  it('should not use GraphiQL CSP on other routes', async () => {
    const response = await request(app).get('/')
    expect(response.statusCode).toBe(200)
    expect(response.headers['content-security-policy']).not.toContain(
      "script-src 'self' unpkg.com 'unsafe-inline'",
    )
    expect(response.headers['content-security-policy']).not.toContain(
      "style-src 'self' unpkg.com",
    )
    expect(response.headers['content-security-policy']).not.toContain(
      "img-src 'self' raw.githubusercontent.com",
    )
  })
})
