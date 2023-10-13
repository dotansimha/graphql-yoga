/* eslint-disable */
const { createYoga, maskError } = require('graphql-yoga');
const { getStitchedSchemaFromSupergraphSdl } = require('@graphql-tools/federation');

module.exports.gateway = async function gateway(config) {
  const schema = getStitchedSchemaFromSupergraphSdl(config);

  const yoga = createYoga({
    schema,
  });

  return yoga;
};
