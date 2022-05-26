import { INestApplication } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import * as request from 'supertest'
import { ApplicationModule } from '../code-first/app.module'

describe.only('Code-first', () => {
  let app: INestApplication

  beforeEach(async () => {
    app = await NestFactory.create(ApplicationModule, { logger: false })
    await app.init()
  })

  it('should return the categories result', async () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: {},
        query: `
      {
        categories {
          name
          description
          tags
        }
      }
    `,
      })
      .expect(200, {
        data: {
          categories: [
            {
              name: 'Category #1',
              description: 'default value',
              tags: [],
            },
          ],
        },
      })
  })

  it('should return the search result', async () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: {},
        query: `
        {
          search {
            ... on Recipe {
              title
            }
            ... on Ingredient {
              name
            }
          }
        }
      `,
      })
      .expect(200, {
        data: {
          search: [
            {
              title: 'recipe',
            },
            {
              name: 'test',
            },
          ],
        },
      })
  })

  it(`should return query result`, async () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: {},
        query: `
        {
          recipes {
            id
            description
            ingredients {
              name
            }
            rating
            interfaceResolver
            averageRating
          }
        }
      `,
      })
      .expect(200, {
        data: {
          recipes: [
            {
              id: '1',
              description: 'Description: Calzone',
              ingredients: [
                {
                  name: 'cherry',
                },
              ],
              rating: 10,
              interfaceResolver: true,
              averageRating: 0.5,
            },
            {
              id: '2',
              description: 'Placeholder',
              ingredients: [
                {
                  name: 'cherry',
                },
              ],
              rating: 10,
              interfaceResolver: true,
              averageRating: 0.5,
            },
          ],
        },
      })
  })

  it(`should return query result`, async () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: {},
        query: `
        {
          recipes {
            id
            ingredients {
              name
            }
            rating
            averageRating
          }
        }
      `,
      })
      .expect(200, {
        data: {
          recipes: [
            {
              id: '1',
              ingredients: [
                {
                  name: 'cherry',
                },
              ],
              rating: 10,
              averageRating: 0.5,
            },
            {
              id: '2',
              ingredients: [
                {
                  name: 'cherry',
                },
              ],
              rating: 10,
              averageRating: 0.5,
            },
          ],
        },
      })
  })

  afterEach(async () => {
    await app.close()
  })
})
