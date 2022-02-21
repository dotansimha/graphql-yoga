import { createPubSub } from '@graphql-yoga/node'
import { Link } from '@prisma/client'

export type PubSubChannels = {
  newLink: [{ newLink: Link }]
}

export const pubSub = createPubSub<PubSubChannels>()
