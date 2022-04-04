import {
  makeSchema,
  scalarType,
  mutationField,
  queryField,
  arg,
  nonNull,
} from 'nexus'
import { createServer } from '@graphql-yoga/node'

const UploadScalar = scalarType({
  name: 'Upload',
  asNexusMethod: 'upload',
  description: 'The `Upload` scalar type represents a file upload.',
  sourceType: 'File',
})

const greetings = queryField('greetings', {
  type: 'String',
  resolve: () => 'Hello World!',
})

const readTextFile = mutationField('readTextFile', {
  type: 'String',
  args: { file: nonNull(arg({ type: 'Upload' })) },
  resolve: async (parent, { file }, ctx) => {
    const textContent = await file.text()
    return textContent
  },
})

const schema = makeSchema({
  types: [UploadScalar, greetings, readTextFile],
})

const server = createServer({
  schema: schema,
})

// Start the server and explore http://localhost:4000/graphql
server.start()
