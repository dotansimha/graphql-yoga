const { GraphQLServer } = require("graphql-yoga");

const typeDefs = `
  directive @upper on FIELD_DEFINITION
  directive @auth(roles: [String]) on FIELD_DEFINITION

  type Query {
    hello: String! @upper
    secret: String @auth(roles: ["admin"])
  }
`;

const directiveResolvers = {
  upper(next, src, args, context) {
    return next().then(str => str.toUpperCase());
  },
  auth(next, src, args, context) {
    const { roles } = context; // We asume has roles of current user in context;
    const expectedRoles = args.roles || [];
    if (
      expectedRoles.length === 0 || expectedRoles.some(r => roles.includes(r))
    ) {
      // Call next to continues process resolver.
      return next();
    }

    // We has two options here. throw an error or return null (if field is nullable).
    throw new Error(
      `You are not authorized. Expected roles: ${expectedRoles.join(", ")}`
    );
  }
};

const resolvers = {
  Query: {
    hello: () => `Hello World`,
    secret: () => `This is very secret`
  }
};

const server = new GraphQLServer({
  typeDefs,
  resolvers,
  directiveResolvers,
  context: () => ({ roles: ["admin"] })
});

server.start(() => console.log("Server is running on localhost:4000"));
