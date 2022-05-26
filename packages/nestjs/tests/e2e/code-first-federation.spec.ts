import { INestApplication } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import * as request from 'supertest'
import { ApplicationModule } from '../code-first-federation/app.module'

describe('Code-first - Federation', () => {
  let app: INestApplication

  beforeEach(async () => {
    app = await NestFactory.create(ApplicationModule, { logger: false })
    await app.init()
  })

  it(`should return query result`, async () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: {},
        query: `
        {
          _service {
            sdl
          }
        }
      `,
      })
      .expect(200, {
        data: {
          _service: {
            sdl: `interface IRecipe {
  id: ID!
  title: String!
  externalField: String! @external
}

type Post @key(fields: \"id\") {
  id: ID!
  title: String!
  authorId: Int!
}

type User @extends @key(fields: \"id\") {
  id: ID! @external
  posts: [Post!]!
}

type Recipe implements IRecipe {
  id: ID!
  title: String!
  externalField: String! @external
  description: String!
}

type Query {
  findPost(id: Float!): Post!
  getPosts: [Post!]!
  search: [FederationSearchResultUnion!]! @deprecated(reason: \"test\")
  recipe: IRecipe!
}

\"\"\"Search result description\"\"\"
union FederationSearchResultUnion = Post | User
`,
          },
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
            ... on Post {
              title
            }
            ... on User {
              id
            }
            __typename
          }
        }
      `,
      })
      .expect(200, {
        data: {
          search: [
            {
              id: '1',
              __typename: 'User',
            },
            {
              title: 'lorem ipsum',
              __typename: 'Post',
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
          recipe {
            id
            title
            ... on Recipe {
              description
            }
          }
        }
      `,
      })
      .expect(200, {
        data: {
          recipe: {
            id: '1',
            title: 'Recipe',
            description: 'Interface description',
          },
        },
      })
  })

  afterEach(async () => {
    await app.close()
  })
})
