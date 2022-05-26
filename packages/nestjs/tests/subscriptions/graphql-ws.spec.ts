import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { InMemoryCache } from 'apollo-cache-inmemory'
import ApolloClient, { ApolloError } from 'apollo-client'
import { gql } from 'graphql-tag'
import { Client, Context, createClient } from 'graphql-ws'
import * as ws from 'ws'
import { AppModule } from './app/app.module'
import { pubSub } from './app/notification.resolver'
import { GraphQLWsLink } from './utils/graphql-ws.link'
import { MalformedTokenException } from './utils/malformed-token.exception'

const subscriptionQuery = gql`
  subscription TestSubscription($id: String!) {
    newNotification(id: $id) {
      id
      message
    }
  }
`

describe('graphql-ws protocol', () => {
  let app: INestApplication
  let wsClient: Client

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        AppModule.forRoot({
          context: (context) => {
            const { authorization } = context?.connectionParams ?? {}
            if (authorization) {
              return { user: authorization.split('Bearer ')[1] }
            } else {
              return {}
            }
          },
          subscriptions: {
            'graphql-ws': {
              onConnect: (context: Context<any>) => {
                if (!context.connectionParams.authorization) {
                  return context.extra.socket.close(
                    4000,
                    'Missing authorization',
                  )
                }
                const authorization = context.connectionParams
                  .authorization as string
                if (!authorization.startsWith('Bearer ')) {
                  throw new MalformedTokenException()
                }
                return true
              },
            },
          },
        }),
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()
    await app.listen(3007)
  })

  it('should receive an error if missing token', (done) => {
    wsClient = createClient({
      url: 'ws://localhost:3007/graphql',
      webSocketImpl: ws,
      connectionParams: {},
      retryAttempts: 0,
    })

    wsClient.on('closed', (ev: any) => {
      expect(ev.code).toEqual(4000)
      expect(ev.reason).toEqual('Missing authorization')
      done()
    })

    const apolloClient = new ApolloClient({
      link: new GraphQLWsLink(wsClient),
      cache: new InMemoryCache(),
    })

    apolloClient
      .subscribe({
        query: subscriptionQuery,
        variables: {
          id: '1',
        },
      })
      .subscribe({
        next() {},
        complete() {},
        error() {},
      })
  })

  it('should receive an error if token is malformed', (done) => {
    wsClient = createClient({
      url: 'ws://localhost:3007/graphql',
      webSocketImpl: ws,
      connectionParams: {
        authorization: 'wrong token',
      },
      retryAttempts: 0,
    })

    wsClient.on('closed', (ev: any) => {
      expect(ev.code).toEqual(4500)
      expect(ev.reason).toEqual('Malformed token')
      done()
    })

    const apolloClient = new ApolloClient({
      link: new GraphQLWsLink(wsClient),
      cache: new InMemoryCache(),
    })

    apolloClient
      .subscribe({
        query: subscriptionQuery,
        variables: {
          id: '1',
        },
      })
      .subscribe({
        next() {},
        complete() {},
        error() {},
      })
  })

  it('should receive error on subscription if guard fails', (done) => {
    wsClient = createClient({
      url: 'ws://localhost:3007/graphql',
      webSocketImpl: ws,
      connectionParams: {
        authorization: 'Bearer notest',
      },
      retryAttempts: 0,
    })

    const apolloClient = new ApolloClient({
      link: new GraphQLWsLink(wsClient),
      cache: new InMemoryCache(),
    })

    apolloClient
      .subscribe({
        query: subscriptionQuery,
        variables: {
          id: '1',
        },
      })
      .subscribe({
        next() {},
        complete() {},
        error(error: unknown) {
          expect(error).toBeInstanceOf(ApolloError)
          expect((error as ApolloError).graphQLErrors[0].message).toEqual(
            'Forbidden resource',
          )
          expect((error as ApolloError).graphQLErrors[0].path[0]).toEqual(
            'newNotification',
          )
          done()
        },
      })
  })

  it('should connect to subscriptions', (done) => {
    wsClient = createClient({
      url: 'ws://localhost:3007/graphql',
      webSocketImpl: ws,
      connectionParams: {
        authorization: 'Bearer test',
      },
      retryAttempts: 0,
    })

    wsClient.on('connected', () => {
      // timeout needed to allow the subscription to be established
      setTimeout(() => {
        pubSub.publish('newNotification', {
          newNotification: {
            id: '2',
            recipient: 'test',
            message: 'wrong message!',
          },
        })
        pubSub.publish('newNotification', {
          newNotification: {
            id: '1',
            recipient: 'someone-else',
            message: 'wrong message!',
          },
        })
        pubSub.publish('newNotification', {
          newNotification: {
            id: '1',
            recipient: 'test',
            message: 'Hello graphql-ws',
          },
        })
      }, 100)
    })

    const apolloClient = new ApolloClient({
      link: new GraphQLWsLink(wsClient),
      cache: new InMemoryCache(),
    })

    apolloClient
      .subscribe({
        query: subscriptionQuery,
        variables: {
          id: '1',
        },
      })
      .subscribe({
        next(value: any) {
          expect(value.data.newNotification.id).toEqual('1')
          expect(value.data.newNotification.message).toEqual('Hello graphql-ws')
          done()
        },
        complete() {},
        error(error: unknown) {
          done(error)
        },
      })
  })

  afterEach(async () => {
    try {
      await wsClient.dispose()
    } catch {}
    await app.close()
  })
})
