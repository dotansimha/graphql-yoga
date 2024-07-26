/* eslint-disable @typescript-eslint/no-var-requires */
import { useEngine } from '@envelop/core';
import { buildHTTPExecutor } from '@graphql-tools/executor-http';
import { schemaFromExecutor } from '@graphql-tools/wrap';

const { createServer } = require('node:http');
const { createYoga } = require('graphql-yoga');

const remoteExecutor = buildHTTPExecutor({
  endpoint: 'https://my.remote.service/graphql',
});

const yoga = createYoga({
  schema: await schemaFromExecutor(remoteExecutor),

  logging: 'debug',
  plugins: [
    useEngine({
      execute: remoteExecutor,
    }),
  ],
});

const server = createServer(yoga);
server.listen(4000, () => {
  console.log(`Server is running on http://localhost:4000${yoga.graphqlEndpoint}`);
});
