import { createSchema } from 'graphql-yoga';
import { testResolver } from './test/resolver';
import { testTypeDefs } from './test/schema';

export const schema = createSchema({
  typeDefs: [testTypeDefs],
  resolvers: [testResolver],
});
