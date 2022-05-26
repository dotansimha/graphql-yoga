import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import * as request from 'supertest'
import { AppModule } from '../graphql-federation/users-service/federation-users.async-existing.module'

describe('GraphQL Federation Async', () => {
  let app: INestApplication

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  it(`should return query result`, () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: {},
        query: `
        {
          getUser(id: "5") {
            id,
            name,
          }
        }`,
      })
      .expect(200, {
        data: {
          getUser: {
            id: '5',
            name: 'GraphQL',
          },
        },
      })
  })

  afterEach(async () => {
    await app.close()
  })
})
