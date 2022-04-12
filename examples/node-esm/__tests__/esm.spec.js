import supertest from 'supertest'
import { server } from '../server.mjs'

describe('Node ESM', () => {
  it('should work', () => {
    supertest(server)
      .post('/graphql')
      .send({
        query: '{ greetings }',
      })
      .expect(200, (err, res) => {
        expect(err).toBeFalsy()
        expect(res.body.data.greetings).toBeTruthy()
      })
  })
})
