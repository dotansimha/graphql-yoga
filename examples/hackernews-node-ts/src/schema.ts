import { makeExecutableSchema } from '@graphql-tools/schema'

export const typeDefinitions = /* GraphQL */ `
  type Query {
    info: String!
    feed: [Link!]!
  }

  type Link {
    id: ID!
    description: String!
    url: String!
  }

  type Mutation {
    post(url: String!, description: String!): Link!
  }
`

// 1
type Link = {
  id: string
  url: string
  description: string
}

// 2
const links: Link[] = [
  {
    id: 'link-0',
    url: 'https://graphql-yoga.com',
    description: 'The easiest way of setting up a GraphQL server',
  },
]

export const resolvers = {
  Query: {
    info: () => `This is the API of a Hackernews Clone`,
    // 3
    feed: () => links,
  },
  // 4
  Link: {
    id: (parent: Link) => parent.id,
    description: (parent: Link) => parent.description,
    url: (parent: Link) => parent.url,
  },
  Mutation: {
    post: (parent: unknown, args: { description: string; url: string }) => {
      // 1
      let idCount = links.length

      // 2
      const link: Link = {
        id: `link-${idCount++}`,
        description: args.description,
        url: args.url,
      }

      links.push(link)

      return link
    },
  },
}

export const schema = makeExecutableSchema({
  resolvers: [resolvers],
  typeDefs: [typeDefinitions],
})
