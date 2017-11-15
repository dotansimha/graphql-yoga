const { GraphQLServer } = require('graphql-yoga')

const sampleItems = [
  {name: 'asd'},
  {name: 'fgh'},
  {name: 'mhv'},
  {name: 'uiy'},
]

const typeDefs = `
  type Query {
    items: [Item!]!
  }

  type Item {
    name: String!
  }
`

const resolvers = {
  Query: {
    items: () => sampleItems,
  },
}

const server = new GraphQLServer({ typeDefs, resolvers })

server.start(() => console.log('Server is running on localhost:3000'))
