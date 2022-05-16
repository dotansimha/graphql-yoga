import { createServer } from '@graphql-yoga/node'
import SchemaBuilder from '@pothos/core'
import type { NextApiRequest, NextApiResponse } from 'next'

const builder = new SchemaBuilder<{
  Scalars: { File: { Input: File; Output: never } }
}>({})

builder.scalarType('File', {
  serialize: () => {
    throw new Error('Uploads can only be used as input types')
  },
})

builder.queryType({
  fields: (t) => ({
    greetings: t.string({ resolve: () => 'Hello World' }),
  }),
})

builder.mutationType({
  fields: (t) => ({
    readTextFile: t.string({
      args: {
        file: t.arg({
          type: 'File',
          required: true,
        }),
      },
      resolve: async (_, { file }) => {
        const textContent = await file.text()

        return textContent
      },
    }),
  }),
})

const schema = builder.toSchema({})

const server = createServer<{
  req: NextApiRequest
  res: NextApiResponse
}>({
  schema,
})
export default server
