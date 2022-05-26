import { INestApplication } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { ExpressAdapter } from '@nestjs/platform-express'
import { Test } from '@nestjs/testing'
import * as request from 'supertest'
import { GlobalPrefixAsyncOptionsClassModule } from '../graphql/global-prefix-async-options-class.module'
import { GlobalPrefixAsyncOptionsModule } from '../graphql/global-prefix-async-options.module'
import { GlobalPrefixModule } from '../graphql/global-prefix.module'

describe('GraphQL (global prefix)', () => {
  let app: INestApplication

  describe('Global prefix with starting slash', () => {
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        imports: [GlobalPrefixModule],
      }).compile()

      app = module.createNestApplication(new ExpressAdapter(), {
        abortOnError: false,
      })
      app.setGlobalPrefix('/api/v1')
      await app.init()
    })

    it('should return query result', () => {
      return request(app.getHttpServer())
        .post('/api/v1/graphql')
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
        .expect(200, {
          data: {
            getCats: [
              {
                id: 1,
                color: 'black',
                weight: 5,
              },
            ],
          },
        })
    })

    afterEach(async () => {
      await app.close()
    })
  })

  describe('Global prefix without starting slash', () => {
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        imports: [GlobalPrefixModule],
      }).compile()

      app = module.createNestApplication(new ExpressAdapter(), {
        abortOnError: false,
      })
      app.setGlobalPrefix('api/v1')
      await app.init()
    })

    it('should return query result', () => {
      return request(app.getHttpServer())
        .post('/api/v1/graphql')
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
        .expect(200, {
          data: {
            getCats: [
              {
                id: 1,
                color: 'black',
                weight: 5,
              },
            ],
          },
        })
    })

    afterEach(async () => {
      await app.close()
    })
  })

  describe('Global prefix with ending slash', () => {
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        imports: [GlobalPrefixModule],
      }).compile()

      app = module.createNestApplication(new ExpressAdapter(), {
        abortOnError: false,
      })
      app.setGlobalPrefix('/api/v1/')
      await app.init()
    })

    it('should return query result', () => {
      return request(app.getHttpServer())
        .post('/api/v1/graphql')
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
        .expect(200, {
          data: {
            getCats: [
              {
                id: 1,
                color: 'black',
                weight: 5,
              },
            ],
          },
        })
    })

    afterEach(async () => {
      await app.close()
    })
  })

  describe('Global prefix (async configuration)', () => {
    beforeEach(async () => {
      app = await NestFactory.create(GlobalPrefixAsyncOptionsModule, {
        logger: false,
        abortOnError: false,
      })
      app.setGlobalPrefix('/api/v1/')
      await app.init()
    })

    it('should return query result', () => {
      return request(app.getHttpServer())
        .post('/api/v1/graphql')
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
        .expect(200, {
          data: {
            getCats: [
              {
                id: 1,
                color: 'black',
                weight: 5,
              },
            ],
          },
        })
    })

    afterEach(async () => {
      await app.close()
    })
  })

  describe('Global prefix (async class)', () => {
    beforeEach(async () => {
      app = await NestFactory.create(GlobalPrefixAsyncOptionsClassModule, {
        logger: false,
        abortOnError: false,
      })
      app.setGlobalPrefix('/api/v1/')
      await app.init()
    })

    it('should return query result', () => {
      return request(app.getHttpServer())
        .post('/api/v1/graphql')
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
        .expect(200, {
          data: {
            getCats: [
              {
                id: 1,
                color: 'black',
                weight: 5,
              },
            ],
          },
        })
    })

    afterEach(async () => {
      await app.close()
    })
  })
})
