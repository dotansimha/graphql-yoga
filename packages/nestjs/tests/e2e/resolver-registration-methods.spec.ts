import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import * as request from 'supertest'
import { ApplicationModule } from '../code-first/app.module'
import { CatsModule } from '../code-first/cats/cats.module'

describe('GraphQL - Resolver registration methods', () => {
  let app: INestApplication

  describe('useClass', () => {
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        imports: [ApplicationModule, CatsModule.register('useClass')],
      }).compile()

      app = module.createNestApplication()
      await app.init()
    })

    it('should return the cats result', async () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: 'query {\n  getAnimalName \n}\n',
        })
        .expect(200, {
          data: {
            getAnimalName: 'cat',
          },
        })
    })

    afterEach(async () => {
      await app.close()
    })
  })

  describe('useValue', () => {
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        imports: [ApplicationModule, CatsModule.register('useValue')],
      }).compile()

      app = module.createNestApplication()
      await app.init()
    })

    it('should return the cats result', async () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: 'query {\n  getAnimalName \n}\n',
        })
        .expect(200, {
          data: {
            getAnimalName: 'cat',
          },
        })
    })

    afterEach(async () => {
      await app.close()
    })
  })

  describe('useFactory', () => {
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        imports: [ApplicationModule, CatsModule.register('useFactory')],
      }).compile()

      app = module.createNestApplication()
      await app.init()
    })

    it('should return the cats result', async () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: 'query {\n  getAnimalName \n}\n',
        })
        .expect(200, {
          data: {
            getAnimalName: 'cat',
          },
        })
    })

    afterEach(async () => {
      await app.close()
    })
  })
})
