import { createSchema, createYoga } from 'graphql-yoga'
import { createServer } from 'http'

const wait = (time: number) =>
  new Promise((resolve) => setTimeout(resolve, time))

const typeDefs = /* GraphQL */ `
  type Query {
    """
    Resolves the alphabet slowly. 1 character per second
    Maybe you want to @stream this field ;)
    """
    alphabet: [String]

    """
    A field that resolves fast.
    """
    fastField: String!

    """
    A field that resolves a bit slow.
    Maybe you want to @defer this field ;)
    """
    mediumSlowField: String!

    """
    A field that resolves slowly.
    Maybe you want to @defer this field ;)
    """
    slowField: String!
  }
`

const alphabet = [
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
]

const resolvers = {
  Query: {
    async *alphabet() {
      for (const character of alphabet) {
        yield character
        await wait(1000)
      }
    },
    fastField: async () => {
      await wait(100)
      return 'I am speed'
    },
    mediumSlowField: async () => {
      await wait(2000)
      return 'Just a bit late, right?'
    },
    slowField: async () => {
      await wait(5000)
      return 'I am slow'
    },
  },
}

const yoga = createYoga({
  schema: createSchema({
    typeDefs,
    resolvers,
  }),
  graphiql: {
    defaultQuery: /* GraphQL */ `
      # Slow alphabet
      query Alphabet {
        alphabet
      }

      # Stream Alphabet
      query StreamAlphabet {
        alphabet @stream
      }

      # Quick field
      query QuickFieldOnly {
        fastField
      }

      # Slow field
      query SlowFieldOnly {
        slowField
      }

      # Slow and Fast field
      query SlowAndFastField {
        slowField
        fastField
      }

      # Slow and Fast using defer
      query SlowAndFastFieldWithDefer {
        ... on Query @defer {
          slowField
        }
        fastField
      }

    `
      .split('\n')
      .map((line) => line.replace('      ', ''))
      .join('\n'),
  },
})

const server = createServer(yoga)
server.listen(4000, () => {
  console.info('Server is running on http://localhost:4000/graphql')
})
