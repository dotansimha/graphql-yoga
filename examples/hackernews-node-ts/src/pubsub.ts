import { createPubSub } from '@graphql-yoga/node'
import { Link, Vote } from '@prisma/client'

export type PubSubChannels = {
  newLink: [{ newLink: Link }]
  newVote: [{ newVote: Vote }]
}

export const pubSub = createPubSub<PubSubChannels>()
