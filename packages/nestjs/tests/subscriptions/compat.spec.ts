import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { InMemoryCache } from 'apollo-cache-inmemory'
import ApolloClient from 'apollo-client'
import { WebSocketLink } from 'apollo-link-ws'
import { gql } from 'graphql-tag'
import { Client, createClient } from 'graphql-ws'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import * as ws from 'ws'
import { AppModule } from './app/app.module'
import { pubSub } from './app/notification.resolver'
import { GraphQLWsLink } from './utils/graphql-ws.link'

const subscriptionQuery = gql`
  subscription TestSubscription($id: String!) {
    newNotification(id: $id) {
      id
      message
    }
  }
`

describe('Use graphql-ws + subscriptions-transport-ws', () => {
  let app: INestApplication
  let wsClient: Client
  let subWsClient: SubscriptionClient

  let gqlWsOnConnect = jest.fn()
  let subTransWsOnConnect = jest.fn()

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        AppModule.forRoot({
          context: (context) => {
            const { authorization } = context?.connectionParams ?? {}
            if (authorization) {
              return { user: authorization.split('Bearer ')[1] }
            } else {
              return context?.connection?.context ?? {}
            }
          },
          subscriptions: {
            'graphql-ws': {
              onConnect: gqlWsOnConnect,
            },
            'subscriptions-transport-ws': {
              onConnect: subTransWsOnConnect,
            },
          },
        }),
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()
    await app.listen(3002)
  })

  it('graphql-ws receives subscriptions', (done) => {
    gqlWsOnConnect.mockReturnValue(true)

    wsClient = createClient({
      url: 'ws://localhost:3002/graphql',
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
          expect(gqlWsOnConnect).toHaveBeenCalledTimes(1)
          expect(subTransWsOnConnect).not.toHaveBeenCalled()
          done()
        },
        complete() {},
        error(error: unknown) {
          done(error)
        },
      })
  })

  it('subscriptions-transport-ws receives subscriptions', (done) => {
    subTransWsOnConnect.mockReturnValue({
      user: 'test',
    })

    subWsClient = new SubscriptionClient(
      'ws://localhost:3002/graphql',
      {
        connectionParams: {
          authorization: 'Bearer test',
        },
      },
      ws,
    )

    subWsClient.on('connected', () => {
      pubSub.publish('newNotification', {
        newNotification: {
          id: '1',
          recipient: 'test',
          message: 'Hello subscriptions-transport-ws',
        },
      })
    })

    const apolloClient = new ApolloClient({
      link: new WebSocketLink(subWsClient),
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
          expect(value.data.newNotification.message).toEqual(
            'Hello subscriptions-transport-ws',
          )
          expect(subTransWsOnConnect).toHaveBeenCalledTimes(1)
          expect(gqlWsOnConnect).not.toHaveBeenCalled()
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
      await wsClient?.dispose()
    } catch {}
    await subWsClient?.close()
    await app.close()
    jest.clearAllMocks()
  })
})
