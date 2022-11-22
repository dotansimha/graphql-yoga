import {
  createSchema,
  createYoga,
  GraphQLParams,
  YogaInitialContext,
} from 'graphql-yoga'

describe('recipe', () => {
  it('id as custom top level POST body query parameter', async () => {
    const yoga = createYoga({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            id: String
          }
        `,
        resolvers: {
          Query: {
            id: (_, __, context: YogaInitialContext) => {
              return context.params.extensions?.id
            },
          },
        },
      }),
      plugins: [
        {
          /**
           * Plugin for allowing the client to send the query ID as a custom POST body query parameter.
           * Before the query parameter validation is happening it is moved to the extensions object.
           */
          onRequestParse() {
            return {
              onRequestParseDone(ctx) {
                function process(requestParserResult: GraphQLParams) {
                  if ('id' in requestParserResult) {
                    return {
                      ...requestParserResult,
                      id: undefined,
                      extensions: {
                        ...requestParserResult.extensions,
                        id: requestParserResult.id,
                      },
                    }
                  }

                  return requestParserResult
                }

                if (Array.isArray(ctx.requestParserResult)) {
                  // also handle batching :)
                  ctx.setRequestParserResult(
                    ctx.requestParserResult.map(process),
                  )
                  return
                }

                ctx.setRequestParserResult(process(ctx.requestParserResult))
              },
            }
          },
        },
      ],
    })

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '{ id }',
        id: '123456',
      }),
    })

    expect(response.status).toEqual(200)
    expect(await response.json()).toEqual({ data: { id: '123456' } })
  })
})
