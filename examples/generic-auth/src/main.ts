import { createYoga, YogaInitialContext } from 'graphql-yoga'
import { useGenericAuth } from '@envelop/generic-auth'
import { createServer } from 'http'

type User = {
  id: string
  email: string
}

const users: Record<string, User> = {
  aaa: {
    id: '1',
    email: 'foo@foo.com',
  },
  bbb: {
    id: '2',
    email: 'foo1@foo.com',
  },
  ccc: {
    id: '2',
    email: 'foo2@foo.com',
  },
}

const yoga = createYoga<{}, { currentUser: User }>({
  plugins: [
    useGenericAuth({
      mode: 'protect-granular',
      async resolveUserFn(context: YogaInitialContext) {
        let accessToken = context.request.headers.get('x-authorization') ?? null
        if (accessToken === null) {
          const url = new URL(context.request.url)
          accessToken = url.searchParams.get('x-authorization')
        }

        if (accessToken === null) {
          return null
        }
        return users[accessToken] ?? null
      },
    }),
  ],
  schema: {
    typeDefs: /* GraphQL */ `
      directive @auth on FIELD_DEFINITION

      type Query {
        requiresAuth: String @auth
        public: String
      }

      type Subscription {
        requiresAuth: String @auth
        public: String
      }
    `,
    resolvers: {
      Query: {
        requiresAuth: (_, _args, context) => `hi ${context.currentUser?.email}`,
        public: () => 'Hi',
      },
      Subscription: {
        requiresAuth: {
          resolve: (value) => value,
          async *subscribe(_, __, context) {
            yield `hi ${context.currentUser?.email}`
          },
        },
        public: {
          resolve: (value) => value,
          async *subscribe() {
            yield `hi`
          },
        },
      },
    },
  },
})

const server = createServer(yoga)
server.listen(4000)
