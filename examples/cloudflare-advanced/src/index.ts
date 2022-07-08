import { createServer } from '@graphql-yoga/common'

declare const EXAMPLE_KV: KVNamespace

const server = createServer({
  schema: {
    typeDefs: /* GraphQL */ `
      scalar File
      scalar JSON
      type Query {
        todoList(limit: Int = 10, cursor: String): TodoList
        readFileAsText(name: String): String
        readFileAsJson(name: String): JSON
      }
      type Mutation {
        addTodo(content: String, expiration: Int): ID
        deleteTodo(id: ID): Boolean
        uploadFile(file: File): Boolean
        deleteFile(name: String): Boolean
      }
      type Subscription {
        scheduled: ScheduledEvent
        time: String
      }
      type TodoList {
        keys: [TodoKeyInfo]
        list_complete: Boolean
        cursor: String
      }
      type TodoKeyInfo {
        name: String
        expiration: Int
        value: String
      }
      type ScheduledEvent {
        cron: String
        scheduledTime: Int
      }
    `,
    resolvers: {
      Query: {
        todoList: async (_, { limit = 10, cursor }) =>
          EXAMPLE_KV.list({
            prefix: 'todo_',
            limit,
            cursor,
          }),
        readFileAsText: (root, args) => EXAMPLE_KV.get(args.name, 'text'),
        readFileAsJson: (root, args) => EXAMPLE_KV.get(args.name, 'json'),
      },
      TodoKeyInfo: {
        value: ({ name }: any) => EXAMPLE_KV.get(name, 'text'),
      },
      Mutation: {
        addTodo: async (_, { content }) => {
          const id = Date.now().toString()
          await EXAMPLE_KV.put(`todo_${Date.now()}`, content)
          return id
        },
        deleteTodo: (_, { id }) => {
          EXAMPLE_KV.delete(`todo_${id}`)
          return true
        },
        uploadFile: async (_, { file }: { file: File }) => {
          const name = file.name
          const arrayBuffer = await file.arrayBuffer()
          await EXAMPLE_KV.put(`textFile_${name}`, arrayBuffer)
          return true
        },
        deleteFile: async (_, { name }) => {
          EXAMPLE_KV.delete(`textFile_${name}`)
          return true
        },
      },
      Subscription: {
        time: {
          async *subscribe() {
            while (true) {
              yield { time: new Date().toISOString() }
              await new Promise((resolve) => setTimeout(resolve, 1000, {}))
            }
          },
        },
        scheduled: {
          async *subscribe() {
            let scheduledEvent: Event
            addEventListener('scheduled', (event) => {
              scheduledEvent = event
            })
            while (true) {
              if (scheduledEvent) {
                const event = scheduledEvent
                scheduledEvent = undefined
                yield event
              }
            }
          },
          resolve: (event) => event,
        },
      },
    },
  },
})

self.addEventListener('fetch', server)
