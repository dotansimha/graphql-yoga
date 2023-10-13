/* eslint-disable */
const { createServer } = require('http');
const { gateway } = require('./gateway');
const { readFileSync } = require('fs');
const { join } = require('path');

async function main() {
  const yoga = await gateway({
    supergraphSdl: readFileSync(join(__dirname, '../supergraph.graphql')).toString('utf-8'),
  });

  // Start the server and explore http://localhost:4000/graphql
  const server = createServer(yoga);
  server.listen(4000, () => {
    console.info(`Server is running on http://localhost:4000${yoga.graphqlEndpoint}`);
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
