const { GraphQLServer } = require('graphql-yoga')
const { SchemaDirectiveVisitor } = require('graphql-tools')
const { defaultFieldResolver } = require('graphql')

const typeDefs = `
  directive @upper on FIELD_DEFINITION
  directive @auth(roles: [String]) on FIELD_DEFINITION

  type Query {
    hello: String! @upper
    secret: String @auth(roles: ["admin"])
  }
`

class UpperDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { resolve = defaultFieldResolver } = field
    field.resolve = async function(...args) {
      const result = await resolve.apply(this, args)
      if (typeof result === 'string') {
        return result.toUpperCase()
      }
      return result
    }
  }
}

class AuthDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { resolve = defaultFieldResolver } = field
    const { roles: expectedRoles = [] } = this.args
    field.resolve = (...args) => {
      const [, , context] = args
      if (
        expectedRoles.length === 0 ||
        expectedRoles.some(r => context.roles.includes(r))
      ) {
        // Call original resolver if role check has passed
        return resolve.apply(this, args)
      }

      // We has two options here. throw an error or return null (if field is nullable).
      throw new Error(
        `You are not authorized. Expected roles: ${expectedRoles.join(', ')}`,
      )
    }
  }
}

const resolvers = {
  Query: {
    hello: () => `Hello World`,
    secret: () => `This is very secret`,
  },
}

const server = new GraphQLServer({
  typeDefs,
  resolvers,
  schemaDirectives: {
    upper: UpperDirective,
    auth: AuthDirective,
  },
  context: () => ({ roles: ['admin'] }),
})

server.start(() => console.log('Server is running on localhost:4000'))
