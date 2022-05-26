import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import * as request from 'supertest'
import { AppModule as PostsModule } from '../graphql-federation/posts-service/federation-posts.module'
import { AppModule as UsersModule } from '../graphql-federation/users-service/federation-users.module'

describe('GraphQL Federation', () => {
  let app: INestApplication

  describe('UsersService', () => {
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        imports: [UsersModule],
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

    it('should resolve references', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          variables: {
            representations: [
              {
                __typename: 'User',
                id: '5',
              },
            ],
          },
          query: `
            query ($representations: [_Any!]!) {
              _entities(representations: $representations) {
                __typename
                ... on User {
                  id
                  name
                }
              }
            }`,
        })
        .expect(200, {
          data: {
            _entities: [
              {
                __typename: 'User',
                id: '5',
                name: 'GraphQL',
              },
            ],
          },
        })
    })
  })

  describe('PostsService', () => {
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        imports: [PostsModule],
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
          getPosts {
            id,
            title,
            body,
          }
        }`,
        })
        .expect(200, {
          data: {
            getPosts: [
              {
                id: '1',
                title: 'HELLO WORLD',
                body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
              },
            ],
          },
        })
    })

    it('should return a stripped reference', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `
        {
          getPosts {
            id,
            title,
            body,
            user {
              id
            }
          }
        }`,
        })
        .expect(200, {
          data: {
            getPosts: [
              {
                id: '1',
                title: 'HELLO WORLD',
                body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
                user: {
                  id: '5',
                },
              },
            ],
          },
        })
    })

    it(`should handle scalars`, () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `
        mutation {
          publishPost(id: "1", publishDate: 500) {
            id,
            title,
            body,
            publishDate
          }
        }`,
        })
        .expect(200, {
          data: {
            publishPost: {
              id: '1',
              title: 'HELLO WORLD',
              body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
              publishDate: 500,
            },
          },
        })
    })

    it('should accept enum as query input', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          variables: {
            postType: 'TEXT',
          },
          query: `
            query ($postType: PostType!) {
              getPosts(type: $postType) {
                id
                type
              }
            }`,
        })
        .expect(200, {
          data: {
            getPosts: [
              {
                id: '1',
                type: 'TEXT',
              },
            ],
          },
        })
    })
  })

  afterEach(async () => {
    await app.close()
  })
})
