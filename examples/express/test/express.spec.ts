import { buildApp } from '../src/app'
import request from 'supertest'

describe('express', () => {
  const app = buildApp()
  it('should show GraphiQL', async () => {
    const response = await request(app)
      .get('/graphql')
      .set('Accept', 'text/html')
    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
  })
  it('should handle POST requests', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({ query: '{ hello }' })
    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('application/json')
    expect(response.body).toStrictEqual({
      data: {
        hello: 'world',
      },
    })
  })
  it('should handle file uploads', async () => {
    const response = await request(app)
      .post('/graphql')
      .field(
        'operations',
        JSON.stringify({
          query: 'mutation ($file: File!) { getFileName(file: $file) }',
          variables: { file: null },
        }),
      )
      .field('map', JSON.stringify({ 0: ['variables.file'] }))
      .attach('0', Buffer.from('TESTCONTENT'), {
        filename: 'file.txt',
        contentType: 'plain/text',
      })
    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('application/json')
    expect(response.body).toStrictEqual({
      data: {
        getFileName: 'file.txt',
      },
    })
  })
})
