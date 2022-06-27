import { BasicProvider } from './providers.js'

export const resolvers = {
  Query: {
    hello: () => 'world',
    contextKeys: (root, args, { injector }: GraphQLModules.AppContext) => {
      return injector.get(BasicProvider).getContextKeys()
    },
  },
  Subscription: {
    countdown: {
      subscribe(_, { from }, { injector }: GraphQLModules.AppContext) {
        return injector.get(BasicProvider).getCountdown(from)
      },
      resolve(countdown) {
        return { countdown }
      },
    },
  },
}
