import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import * as request from 'supertest'
import { Guard } from '../graphql/hello/guards/request-scoped.guard'
import { HelloModule } from '../graphql/hello/hello.module'
import { HelloResolver } from '../graphql/hello/hello.resolver'
import { Interceptor } from '../graphql/hello/interceptors/logging.interceptor'
import { UsersService } from '../graphql/hello/users/users.service'

class Meta {
  static COUNTER = 0
  constructor() {
    Meta.COUNTER++
  }
}

describe('Request scope', () => {
  let server
  let app: INestApplication

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        HelloModule.forRoot({
          provide: 'META',
          useClass: Meta,
        }),
      ],
    }).compile()

    app = module.createNestApplication()
    server = app.getHttpServer()
    await app.init()
  })

  describe('when one service is request scoped', () => {
    beforeAll(async () => {
      const performHttpCall = (end) =>
        request(server)
          .post('/graphql')
          .send({
            operationName: null,
            variables: {},
            query: `
        {
          getCats {
            id,
            color,
            weight
          }
        }`,
          })
          .end((err, res) => {
            if (err) return end(err)
            end()
          })
      await new Promise((resolve) => performHttpCall(resolve))
      await new Promise((resolve) => performHttpCall(resolve))
      await new Promise((resolve) => performHttpCall(resolve))
    })

    it(`should create resolver for each request`, async () => {
      expect(HelloResolver.COUNTER).toEqual(3)
    })

    it(`should create service for each request`, async () => {
      expect(UsersService.COUNTER).toEqual(3)
    })

    it(`should share static provider across requests`, async () => {
      expect(Meta.COUNTER).toEqual(1)
    })

    it(`should create request scoped interceptor for each request`, async () => {
      expect(Interceptor.COUNTER).toEqual(3)
      expect(Interceptor.REQUEST_SCOPED_DATA).toEqual([1, 1, 1])
    })

    it(`should create request scoped guard for each request`, async () => {
      expect(Guard.COUNTER).toEqual(3)
      expect(Guard.REQUEST_SCOPED_DATA).toEqual([1, 1, 1])
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
