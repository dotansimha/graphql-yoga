/* eslint-disable */
const { GraphQLError } = require('graphql');
const { buildSubgraphSchema } = require('@apollo/subgraph');
const { createYoga } = require('graphql-yoga');

const typeDefs = require('./typeDefs.js')

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
  schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
});
