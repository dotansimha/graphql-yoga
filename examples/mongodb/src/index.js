import { GraphQLServer } from 'graphql-yoga';
import { startDB, models } from './db';
import resolvers from './graphql/resolvers';

const db = startDB({ 
  user: 'graphql', 
  pwd: 'yoga123', 
  db: 'graphqlYoga', 
  url: 'localhost:27017' 
})

const context = {
  models,
  db,
};

const Server = new GraphQLServer({
  typeDefs: `${__dirname}/graphql/schema.graphql`,
  resolvers,
  context,
});

// options
const opts = {
  port: 4000,
};


Server.start(opts, () => {
  console.log(`Server is running on http://localhost:${opts.port}`);
});
