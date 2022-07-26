import {
  makeSchema,
  scalarType,
  mutationField,
  queryField,
  arg,
  nonNull,
} from 'nexus'
import { createYoga } from 'graphql-yoga'
import { createServer } from 'http'

const FileScalar = scalarType({
  name: 'File',
  asNexusMethod: 'file',
  description: 'The `File` scalar type represents a file upload.',
  sourceType: 'File',
})

const greetings = queryField('greetings', {
  type: 'String',
  resolve: () => 'Hello World!',
})

const readTextFile = mutationField('readTextFile', {
  type: 'String',
  args: { file: nonNull(arg({ type: 'File' })) },
  resolve: async (parent, { file }) => {
    const textContent = await file.text()
    return textContent
  },
})

const schema = makeSchema({
  types: [FileScalar, greetings, readTextFile],
})

const yoga = createYoga({
  schema,
})

const server = createServer(yoga)

// Start the server and explore http://localhost:4000/graphql
server.listen(4000)
