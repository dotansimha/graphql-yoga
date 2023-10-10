/* eslint-disable */
const { parse, GraphQLError } = require('graphql');
const { buildSubgraphSchema } = require('@graphql-tools/federation');
const { createYoga } = require('graphql-yoga');

const typeDefs = parse(/* GraphQL */ `
  type Query {
    me: User
    throw: String
  }

  type User @key(fields: "id") {
    id: ID!
    username: String
  }
`);

const resolvers = {
  Query: {
    me() {
      return { id: '1', username: '@ava' };
    },
    throw() {
      throw new GraphQLError('This should throw.');
    },
  },
  User: {
    __resolveReference(user, { fetchUserById }) {
      return fetchUserById(user.id);
    },
  },
};

module.exports.yoga = createYoga({
  schema: buildSubgraphSchema({ typeDefs, resolvers }),
});
