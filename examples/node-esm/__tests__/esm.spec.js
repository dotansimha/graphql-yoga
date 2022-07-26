import supertest from 'supertest'
import { yoga } from '../yoga.mjs'

describe('Node ESM', () => {
  it('should work', () => {
    supertest(yoga)
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
