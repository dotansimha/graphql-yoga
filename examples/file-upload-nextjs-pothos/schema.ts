import SchemaBuilder from '@pothos/core'

const builder = new SchemaBuilder<{
  Scalars: { File: { Input: File; Output: never } }
}>({})

builder.scalarType('File', {
  serialize: () => {
    throw new Error('Uploads can only be used as input types')
  },
})

builder.queryType({
  fields: t => ({
    greetings: t.string({ resolve: () => 'Hello World' }),
  }),
})

builder.mutationType({
  fields: t => ({
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

export const schema = builder.toSchema({})
