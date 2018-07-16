const { GraphQLServer } = require('graphql-yoga')
const { Prisma } = require('prisma-binding')

const typeDefs = `
  type User {
    id: ID!
    name: String
  }

  type Query {
    users: [User!]!
  }

  type Mutation {
    createUser(name: String): User
  }
`

const resolvers = {
  Query: {
    users: (root, args, ctx, info) => ctx.prisma.query.users({}, info),
  },
  Mutation: {
    createUser: (root, args, ctx, info) =>
      ctx.prisma.mutation.createUser({ data: { name: args.name } }, info),
  },
}

const server = new GraphQLServer({
  typeDefs,
  resolvers,
  context: req => ({
    ...req,
    prisma: new Prisma({
      typeDefs: './prisma.graphql',
      endpoint: 'https://eu1.prisma.sh/public-prisma-yoga-example-js/prisma/dev',
      debug: true,
    }),
  }),
})

server.start(() => console.log('Server is running on http://localhost:4000'))
