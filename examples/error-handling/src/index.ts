import { createServer } from 'node:http';
import { yoga } from './yoga';

// Start the server and explore http://localhost:4000/graphql
const server = createServer(yoga);
server.listen(4000, () => {
  console.info(`Server is running on http://localhost:4000${yoga.graphqlEndpoint}`);
});
