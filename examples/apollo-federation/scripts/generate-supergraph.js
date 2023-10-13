/* eslint-disable */
// Compose services and create Supergraph SDL using https://github.com/the-guild-org/federation
const { composeServices, compositionHasErrors } = require('@theguild/federation-composition');
const { join } = require('path');
const { writeFileSync } = require('fs');

const result = composeServices([
  {
    name: 'accounts',
    typeDefs: require('../service/typeDefs.js'),
    url: 'http://localhost:4001/graphql',
  },
]);

if (compositionHasErrors(result)) {
  console.error(result.errors);
  process.exit(1);
} else {
  writeFileSync(join(__dirname, '../supergraph.graphql'), result.supergraphSdl);
}
