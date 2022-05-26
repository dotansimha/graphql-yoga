import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import * as request from 'supertest'
import { AppModule as GatewayModule } from '../graphql-federation/gateway/gateway-async.module'
import { AppModule as PostsModule } from '../graphql-federation/posts-service/federation-posts.module'
import { AppModule as UsersModule } from '../graphql-federation/users-service/federation-users.module'

describe('GraphQL Gateway async', () => {
  let postsApp: INestApplication
  let usersApp: INestApplication
  let gatewayApp: INestApplication

  beforeEach(async () => {
    const usersModule = await Test.createTestingModule({
      imports: [UsersModule],
    }).compile()

    usersApp = usersModule.createNestApplication()
    await usersApp.listen(3001)

    const postsModule = await Test.createTestingModule({
      imports: [PostsModule],
    }).compile()

    postsApp = postsModule.createNestApplication()
    await postsApp.listen(3002)

    const gatewayModule = await Test.createTestingModule({
      imports: [GatewayModule],
    }).compile()

    gatewayApp = gatewayModule.createNestApplication()
    await gatewayApp.init()
  })

  it(`should run lookup across boundaries`, () => {
    return request(gatewayApp.getHttpServer())
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
              id,
              name,
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
                name: 'GraphQL',
              },
            },
          ],
        },
      })
  })

  afterEach(async () => {
    await postsApp.close()
    await usersApp.close()
    await gatewayApp.close()
  })
})
