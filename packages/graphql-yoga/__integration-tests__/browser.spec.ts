import { InMemoryLiveQueryStore } from '@n1ru4l/in-memory-live-query-store'
import { GraphQLLiveDirective, useLiveQuery } from '@envelop/live-query'
import { CORSOptions, createYoga } from 'graphql-yoga'
import { renderGraphiQL } from '@graphql-yoga/render-graphiql'
import puppeteer from 'puppeteer'
import { createServer, Server } from 'http'
import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLList,
  GraphQLFloat,
  GraphQLNonNull,
} from 'graphql'
import { GraphQLBigInt } from 'graphql-scalars'
import 'json-bigint-patch'
import { AddressInfo } from 'net'

export function createTestSchema() {
  let liveQueryCounter = 0

  return new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Query',
      fields: () => ({
        alwaysFalse: {
          type: GraphQLBoolean,
          resolve: () => false,
        },
        alwaysTrue: {
          type: GraphQLBoolean,
          resolve: () => true,
        },
        echo: {
          args: {
            text: {
              type: GraphQLString,
            },
          },
          type: GraphQLString,
          resolve: (_root, args) => args.text,
        },
        hello: {
          type: GraphQLString,
          resolve: () => 'hello',
        },
        goodbye: {
          type: GraphQLString,
          resolve: () =>
            new Promise((resolve) =>
              setTimeout(() => resolve('goodbye'), 1000),
            ),
        },
        stream: {
          type: new GraphQLList(GraphQLString),
          async *resolve() {
            yield 'A'
            await new Promise((resolve) => setTimeout(resolve, 1000))
            yield 'B'
            await new Promise((resolve) => setTimeout(resolve, 1000))
            yield 'C'
          },
        },
        bigint: {
          type: GraphQLBigInt,
          resolve: () => BigInt('112345667891012345'),
        },
        liveCounter: {
          type: GraphQLInt,
          resolve: () => {
            liveQueryCounter++
            return liveQueryCounter
          },
        },
      }),
    }),
    mutation: new GraphQLObjectType({
      name: 'Mutation',
      fields: () => ({
        setFavoriteNumber: {
          args: {
            number: {
              type: GraphQLInt,
            },
          },
          type: GraphQLInt,
          resolve: (_root, args) => {
            return args.number
          },
        },
      }),
    }),
    subscription: new GraphQLObjectType({
      name: 'Subscription',
      fields: () => ({
        error: {
          type: GraphQLBoolean,
          // eslint-disable-next-line require-yield
          async *subscribe() {
            throw new Error('This is not okay')
          },
        },
        eventEmitted: {
          type: GraphQLFloat,
          async *subscribe() {
            yield { eventEmitted: Date.now() }
          },
        },
        count: {
          type: GraphQLInt,
          args: {
            to: {
              type: new GraphQLNonNull(GraphQLInt),
            },
          },
          async *subscribe(_root, args) {
            for (let count = 1; count <= args.to; count++) {
              yield { count }
              await new Promise((resolve) => setTimeout(resolve, 100))
            }
          },
        },
      }),
    }),
    directives: [GraphQLLiveDirective],
  })
}

describe('browser', () => {
  const liveQueryStore = new InMemoryLiveQueryStore()
  const endpoint = '/test-graphql'
  let cors: CORSOptions = {}
  const yogaApp = createYoga({
    schema: createTestSchema(),
    cors: () => cors,
    logging: false,
    graphqlEndpoint: endpoint,
    plugins: [
      useLiveQuery({
        liveQueryStore,
      }),
    ],
    renderGraphiQL,
  })

  let browser: puppeteer.Browser
  let page: puppeteer.Page

  const playButtonSelector = `[aria-label^="Execute"]`
  const stopButtonSelector = `[aria-label^="Stop"]`

  let port: number
  const server = createServer(yogaApp)

  beforeAll(async () => {
    await new Promise<void>((resolve) => server.listen(0, resolve))
    port = (server.address() as AddressInfo).port
    browser = await puppeteer.launch({
      // If you wanna run tests with open browser
      // set your PUPPETEER_HEADLESS env to "false"
      headless: process.env.PUPPETEER_HEADLESS !== 'false',
      args: ['--incognito'],
    })
  })
  beforeEach(async () => {
    if (page !== undefined) {
      await page.close()
    }
    const context = await browser.createIncognitoBrowserContext()
    page = await context.newPage()
  })
  afterAll(async () => {
    await browser.close()
    await new Promise((resolve) => server.close(resolve))
  })

  const typeOperationText = async (text: string) => {
    await page.type('.graphiql-query-editor .CodeMirror textarea', text)
    // TODO: figure out how we can avoid this wait
    // it is very likely that there is a delay from textarea -> react state update
    await new Promise((res) => setTimeout(res, 100))
  }

  const typeVariablesText = async (text: string) => {
    await page.type('[aria-label="Variables"] .CodeMirror textarea', text)
    // TODO: figure out how we can avoid this wait
    // it is very likely that there is a delay from textarea -> react state update
    await new Promise((res) => setTimeout(res, 100))
  }

  const waitForResult = async () => {
    await page.waitForFunction(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      () => !!window.g.resultComponent.viewer.getValue(),
    )
    const resultContents = await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return window.g.resultComponent.viewer.getValue()
    })

    return resultContents
  }

  describe('GraphiQL', () => {
    it('execute simple query operation', async () => {
      await page.goto(`http://localhost:${port}${endpoint}`)
      await typeOperationText('{ alwaysTrue }')

      await page.click('.graphiql-execute-button')
      const resultContents = await waitForResult()

      expect(resultContents).toEqual(
        JSON.stringify(
          {
            data: {
              alwaysTrue: true,
            },
          },
          null,
          2,
        ),
      )
    })

    it('execute mutation operation', async () => {
      await page.goto(`http://localhost:${port}${endpoint}`)
      await typeOperationText(
        `mutation ($number: Int!) {  setFavoriteNumber(number: $number) }`,
      )
      await typeVariablesText(`{ "number": 3 }`)
      await page.click('.graphiql-execute-button')
      const resultContents = await waitForResult()

      expect(resultContents).toEqual(
        JSON.stringify(
          {
            data: {
              setFavoriteNumber: 3,
            },
          },
          null,
          2,
        ),
      )
    })

    test('execute SSE (subscription) operation', async () => {
      await page.goto(`http://localhost:${port}${endpoint}`)
      await typeOperationText(`subscription { count(to: 2) }`)
      await page.click('.graphiql-execute-button')

      await new Promise((res) => setTimeout(res, 50))

      const [resultContents, isShowingStopButton] = await page.evaluate(
        (stopButtonSelector) => {
          return [
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            window.g.resultComponent.viewer.getValue(),
            !!window.document.querySelector(stopButtonSelector),
          ]
        },
        stopButtonSelector,
      )
      expect(JSON.parse(resultContents)).toEqual({
        data: {
          count: 1,
        },
      })
      expect(isShowingStopButton).toEqual(true)
      await new Promise((resolve) => setTimeout(resolve, 300))
      const [resultContents1, isShowingPlayButton] = await page.evaluate(
        (playButtonSelector) => {
          return [
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            window.g.resultComponent.viewer.getValue(),
            !!window.document.querySelector(playButtonSelector),
          ]
        },
        playButtonSelector,
      )
      expect(JSON.parse(resultContents1)).toEqual({
        data: {
          count: 2,
        },
      })
      expect(isShowingPlayButton).toEqual(true)
    })

    test('show the query provided in the search param', async () => {
      const query = '{ alwaysTrue }'
      await page.goto(
        `http://localhost:${port}${endpoint}?query=${encodeURIComponent(
          query,
        )}`,
      )
      await page.click('.graphiql-execute-button')
      const resultContents = await waitForResult()

      expect(resultContents).toEqual(
        JSON.stringify(
          {
            data: {
              alwaysTrue: true,
            },
          },
          null,
          2,
        ),
      )
    })

    test('should show BigInt correctly', async () => {
      await page.goto(`http://localhost:${port}${endpoint}`)
      await typeOperationText(`{ bigint }`)
      await page.click('.graphiql-execute-button')
      const resultContents = await waitForResult()

      expect(resultContents).toEqual(`{
  "data": {
    "bigint": ${BigInt('112345667891012345').toString()}
  }
}`)
    })
    test('should show live queries correctly', async () => {
      await page.goto(`http://localhost:${port}${endpoint}`)
      await typeOperationText(`query @live { liveCounter }`)
      await page.click('.graphiql-execute-button')

      await new Promise((res) => setTimeout(res, 50))

      const [resultContents] = await page.evaluate((stopButtonSelector) => {
        return [
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          window.g.resultComponent.viewer.getValue(),
          !!window.document.querySelector(stopButtonSelector),
        ]
      }, stopButtonSelector)
      const resultJson = JSON.parse(resultContents)

      expect(resultJson).toEqual({
        data: {
          liveCounter: 1,
        },
        isLive: true,
      })
      liveQueryStore.invalidate('Query.liveCounter')

      const watchDog = await page.waitForFunction(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const value = window.g.resultComponent.viewer.getValue()

        return value.includes('2')
      })

      await watchDog

      const [resultContents1] = await page.evaluate((playButtonSelector) => {
        return [
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          window.g.resultComponent.viewer.getValue(),
          !!window.document.querySelector(playButtonSelector),
        ]
      }, playButtonSelector)
      const resultJson1 = JSON.parse(resultContents1)
      expect(resultJson1).toEqual({
        data: {
          liveCounter: 2,
        },
        isLive: true,
      })
    })
  })

  describe('CORS', () => {
    let anotherServer: Server
    let anotherOriginPort: number
    beforeAll(async () => {
      anotherServer = createServer((_req, res) => {
        res.end(/* HTML */ `
          <html>
            <head>
              <title>Another Origin</title>
            </head>
            <body>
              <h1>Another Origin</h1>
              <p id="result">RESULT_HERE</p>
              <script>
                async function fetchData() {
                  try {
                    const response = await fetch(
                      'http://localhost:${port}${endpoint}',
                      {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          query: '{ alwaysTrue }',
                        }),
                      },
                    )
                    document.getElementById('result').innerHTML =
                      await response.text()
                  } catch (e) {
                    document.getElementById('result').innerHTML = e.stack
                  }
                }
                fetchData()
              </script>
            </body>
          </html>
        `)
      })
      await new Promise<void>((resolve) =>
        anotherServer.listen(0, () => resolve()),
      )
      anotherOriginPort = (anotherServer.address() as AddressInfo).port
    })
    afterAll(async () => {
      await new Promise<void>((resolve) => anotherServer.close(() => resolve()))
    })
    test('allow other origins by default', async () => {
      await page.goto(`http://localhost:${anotherOriginPort}`)
      const result = await page.evaluate(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return document.getElementById('result')?.innerHTML
      })
      expect(result).toEqual(
        JSON.stringify({
          data: {
            alwaysTrue: true,
          },
        }),
      )
    })
    test('allow if specified', async () => {
      cors = {
        origin: [`http://localhost:${anotherOriginPort}`],
      }
      await page.goto(`http://localhost:${anotherOriginPort}`)
      const result = await page.evaluate(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return document.getElementById('result')?.innerHTML
      })
      expect(result).toEqual(
        JSON.stringify({
          data: {
            alwaysTrue: true,
          },
        }),
      )
    })
    test('restrict other origins if provided', async () => {
      cors = {
        origin: ['http://localhost:${port}'],
      }
      await page.goto(`http://localhost:${anotherOriginPort}`)
      const result = await page.evaluate(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return document.getElementById('result')?.innerHTML
      })
      expect(result).toContain('Failed to fetch')
    })
    test('send specific origin back to user if credentials are set true', async () => {
      cors = {
        origin: [`http://localhost:${anotherOriginPort}`],
        credentials: true,
      }
      await page.goto(`http://localhost:${anotherOriginPort}`)
      const result = await page.evaluate(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return document.getElementById('result')?.innerHTML
      })
      expect(result).toEqual(
        JSON.stringify({
          data: {
            alwaysTrue: true,
          },
        }),
      )
    })
  })
})
