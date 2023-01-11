import SchemaBuilder from '@pothos/core'
import { createYoga } from 'graphql-yoga'

const builder = new SchemaBuilder({})

builder.queryType({
  fields: t => ({
    hello: t.string({
      args: {
        name: t.arg.string({ required: true, defaultValue: 'world' }),
      },
      resolve: (_parent, { name }) => name,
    }),
  }),
})

builder.subscriptionType({
  fields: t => ({
    greetings: t.string({
      async *subscribe() {
        yield 'Hi'
        yield 'Bonjour'
        yield 'Hola'
        yield 'Ciao'
        yield 'Zdravo'
      },
      resolve(parent) {
        return parent
      },
    }),
  }),
})

export const yoga = createYoga({
  schema: builder.toSchema(),
})
