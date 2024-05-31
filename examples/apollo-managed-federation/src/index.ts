import { createServer } from 'node:http';
import { createYoga } from 'graphql-yoga';
import { useManagedFederation } from '@graphql-yoga/apollo-managed-federation';

const yoga = createYoga({
  plugins: [useManagedFederation()],
});

const server = createServer(yoga);

server.listen(4000, () => {
  console.log('Server is running on http://localhost:4000');
});

process.on('SIGINT', () => {
  server.close();
});
