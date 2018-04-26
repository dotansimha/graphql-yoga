const { GraphQLServer } = require('../../dist/src/index')
const { default: costAnalysis } = require('graphql-cost-analysis')

const typeDefs = `
  type Query {
    posts(limit: Int!): [Post!]! 
      @cost(multipliers: ["limit"], complexity: 10)
  }

  type Post {
    id: Int!
    title: String!
  }

  directive @cost(
    complexity: Int
    useMultipliers: Boolean
    multipliers: [String!]
  ) on FIELD_DEFINITION
`

const posts = [
  'My first blog post', 
  'My second', 
  'My third', 
  'My fourth',
  'My fifth',
].map((title, index) => ({
  id: index,
  title,
}))

const resolvers = {
  Query: {
    posts: (source, {limit}) => posts.slice(0, limit),
  },
}

const server = new GraphQLServer({ 
  typeDefs, 
  resolvers,
})

server.start({
  validationRules: (req) => [
    costAnalysis({
      variables: req.query.variables,
      maximumCost: 50,
      defaultCost: 1,
      onComplete(cost) {
        console.log(`Cost analysis score: ${cost}`)
      },
    })
  ]
}).then(() => {
  console.log('Server is running on http://localhost:4000')
}).catch(() => {
  console.error('Server start failed', err)
  process.exit(1)
})
