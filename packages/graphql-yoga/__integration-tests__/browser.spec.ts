import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';
import { GraphQLBigInt } from 'graphql-scalars';
import { GraphQLLiveDirective, useLiveQuery } from '@envelop/live-query';
import { useDeferStream } from '@graphql-yoga/plugin-defer-stream';
import { renderGraphiQL } from '@graphql-yoga/render-graphiql';
import { InMemoryLiveQueryStore } from '@n1ru4l/in-memory-live-query-store';
import 'json-bigint-patch';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import puppeteer, { Browser, ElementHandle, Page } from 'puppeteer';
import { CORSOptions, createYoga, Repeater } from '../src/index.js';

let resolveOnReturn: VoidFunction;
const timeouts = new Set<NodeJS.Timeout>();

let charCode = 'A'.charCodeAt(0);
const fakeAsyncIterable = {
  [Symbol.asyncIterator]() {
    return this;
  },
  next: () =>
    sleep(300, timeout => timeouts.add(timeout)).then(() => ({
      value: String.fromCharCode(charCode++),
      done: false,
    })),
  return: () => {
    resolveOnReturn();
    // eslint-disable-next-line unicorn/no-array-for-each -- is Set
    timeouts.forEach(clearTimeout);
    return Promise.resolve({ done: true });
  },
};

export function createTestSchema() {
  let liveQueryCounter = 0;

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
          resolve: () => new Promise(resolve => setTimeout(() => resolve('goodbye'), 1000)),
        },
        stream: {
          type: new GraphQLList(GraphQLString),
          resolve: () => fakeAsyncIterable,
        },
        bigint: {
          type: GraphQLBigInt,
          resolve: () => BigInt('112345667891012345'),
        },
        liveCounter: {
          type: GraphQLInt,
          resolve: () => {
            liveQueryCounter++;
            return liveQueryCounter;
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
            return args.number;
          },
        },
      }),
    }),
    subscription: new GraphQLObjectType({
      name: 'Subscription',
      fields: () => ({
        counter: {
          type: GraphQLInt,
          subscribe: () =>
            new Repeater((push, end) => {
              let counter = 0;
              const send = () => push(counter++);
              const interval = setInterval(() => send(), 1000);
              end.then(() => clearInterval(interval));
            }),
          resolve: value => value,
        },
        countdown: {
          type: new GraphQLNonNull(GraphQLInt),
          args: {
            from: {
              type: new GraphQLNonNull(GraphQLInt),
            },
          },
          subscribe: (_, { from }) =>
            new Repeater((push, end) => {
              let counter = from;
              const send = () => {
                push(counter);
                if (counter === 0) {
                  end();
                }

                counter--;
              };
              const interval = setInterval(() => send(), 1000);
              end.then(() => clearInterval(interval));
            }),
          resolve: value => value,
        },
        error: {
          type: GraphQLBoolean,
          // eslint-disable-next-line require-yield
          async *subscribe() {
            throw new Error('This is not okay');
          },
        },
        eventEmitted: {
          type: GraphQLFloat,
          async *subscribe() {
            yield { eventEmitted: Date.now() };
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
              yield { count };
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          },
        },
      }),
    }),
    directives: [GraphQLLiveDirective],
  });
}

describe('browser', () => {
  const liveQueryStore = new InMemoryLiveQueryStore();
  const endpoint = '/test-graphql';
  let cors: CORSOptions = {};
  const yogaApp = createYoga({
    schema: createTestSchema(),
    cors: () => cors,
    logging: false,
    graphqlEndpoint: endpoint,
    plugins: [
      useLiveQuery({
        liveQueryStore,
      }),
      useDeferStream(),
    ],
    renderGraphiQL,
  });

  let browser: Browser;
  let page: Page;

  const playButtonSelector = `[aria-label^="Execute"]`;
  const stopButtonSelector = `[aria-label^="Stop"]`;

  let port: number;
  const server = createServer(yogaApp);

  beforeAll(async () => {
    await new Promise<void>(resolve => server.listen(0, resolve));
    port = (server.address() as AddressInfo).port;
    browser = await puppeteer.launch({
      // If you wanna run tests with open browser
      // set your PUPPETEER_HEADLESS env to "false"
      headless: process.env.PUPPETEER_HEADLESS !== 'false',
      args: ['--incognito'],
    });
  });
  beforeEach(async () => {
    if (page !== undefined) {
      await page.close();
    }
    const context = await browser.createIncognitoBrowserContext();
    page = await context.newPage();
  });
  afterAll(async () => {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  });

  const typeOperationText = async (text: string) => {
    await page.type('.graphiql-query-editor .CodeMirror textarea', text);
    // TODO: figure out how we can avoid this wait
    // it is very likely that there is a delay from textarea -> react state update
    await new Promise(res => setTimeout(res, 100));
  };

  const typeVariablesText = async (text: string) => {
    await page.type('[aria-label="Variables"] .CodeMirror textarea', text);
    // TODO: figure out how we can avoid this wait
    // it is very likely that there is a delay from textarea -> react state update
    await new Promise(res => setTimeout(res, 100));
  };

  const waitForResult = async (): Promise<object> => {
    await page.waitForFunction(
      () =>
        !!window.document.querySelector('.graphiql-response .CodeMirror-code')?.textContent?.trim(),
    );
    const resultContents = await page.evaluate(() => {
      return window.document
        .querySelector('.graphiql-response .CodeMirror-code')
        ?.textContent?.trim()
        .replaceAll('\u00A0', ' ');
    });

    return JSON.parse(resultContents!);
  };

  const showGraphiQLSidebar = async () => {
    // Click to show sidebar
    await page.click('.graphiql-sidebar [aria-label="Show Documentation Explorer"]');
  };

  const getElementText = async (element: ElementHandle<Element>) =>
    element.evaluate(el => el.textContent?.trim());

  describe('GraphiQL', () => {
    it('should show default title', async () => {
      await page.goto(`http://localhost:${port}${endpoint}`);

      const title = await page.evaluate(() => document.title);

      expect(title).toBe('Yoga GraphiQL');
    });

    it('should show default schema docs', async () => {
      await page.goto(`http://localhost:${port}${endpoint}`);

      // Click to show sidebar
      await showGraphiQLSidebar();

      const docsElement = await page.waitForSelector('.graphiql-markdown-description');

      expect(docsElement).not.toBeNull();
      const docs = await getElementText(docsElement!);

      expect(docs).toBe('A GraphQL schema provides a root type for each kind of operation.');
    });

    it('should show editor tools by default', async () => {
      await page.goto(`http://localhost:${port}${endpoint}`);

      // If this button is visible, that mean editor tools is showing
      const buttonHideEditor = await page.$('button[aria-label="Hide editor tools"]');

      const editorTabs = await page.evaluate(() =>
        Array.from(document.querySelectorAll('.graphiql-editor-tools button'), e => e.textContent),
      );

      expect(buttonHideEditor).not.toBeNull();
      expect(editorTabs).toContain('Variables');
      expect(editorTabs).toContain('Headers');
    });

    it('execute simple query operation', async () => {
      await page.goto(`http://localhost:${port}${endpoint}`);
      await typeOperationText('{ alwaysTrue }');

      await page.click(playButtonSelector);
      const resultContents = await waitForResult();

      expect(resultContents).toEqual({
        data: {
          alwaysTrue: true,
        },
      });
    });

    it('execute mutation operation', async () => {
      await page.goto(`http://localhost:${port}${endpoint}`);
      await typeOperationText(`mutation ($number: Int!) {  setFavoriteNumber(number: $number) }`);
      await typeVariablesText(`{ "number": 3 }`);
      await page.click('.graphiql-execute-button');
      const resultContents = await waitForResult();

      expect(resultContents).toEqual({
        data: {
          setFavoriteNumber: 3,
        },
      });
    });

    test('execute @stream operation', async () => {
      await page.goto(`http://localhost:${port}${endpoint}?query={ stream @stream }`);
      const returnPromise$ = new Promise<void>(resolve => {
        resolveOnReturn = resolve;
      });
      await page.click('.graphiql-execute-button');
      await sleep(900);
      const resultContents = await waitForResult();
      const isShowingStopButton = await page.evaluate(stopButtonSelector => {
        return !!window.document.querySelector(stopButtonSelector);
      }, stopButtonSelector);
      expect(isShowingStopButton).toEqual(true);
      expect(resultContents).toEqual({
        data: {
          stream: ['A', 'B', 'C'],
        },
      });
      await page.click(stopButtonSelector);
      await returnPromise$;
      expect(isShowingStopButton).toEqual(true);
    });

    test('execute SSE (subscription) operation', async () => {
      await page.goto(`http://localhost:${port}${endpoint}`);
      await typeOperationText(`subscription { count(to: 2) }`);
      await page.click('.graphiql-execute-button');

      await new Promise(res => setTimeout(res, 50));

      const resultContents = await waitForResult();
      const isShowingStopButton = await page.evaluate(stopButtonSelector => {
        return !!window.document.querySelector(stopButtonSelector);
      }, stopButtonSelector);
      expect(resultContents).toEqual({
        data: {
          count: 1,
        },
      });
      expect(isShowingStopButton).toEqual(true);

      await new Promise(resolve => setTimeout(resolve, 300));

      const resultContents1 = await waitForResult();
      const isShowingPlayButton = await page.evaluate(playButtonSelector => {
        return !!window.document.querySelector(playButtonSelector);
      }, playButtonSelector);
      expect(resultContents1).toEqual({
        data: {
          count: 2,
        },
      });
      expect(isShowingPlayButton).toEqual(true);
    });

    test('show the query provided in the search param', async () => {
      const query = '{ alwaysTrue }';
      await page.goto(`http://localhost:${port}${endpoint}?query=${encodeURIComponent(query)}`);
      await page.click('.graphiql-execute-button');
      const resultContents = await waitForResult();

      expect(resultContents).toEqual({
        data: {
          alwaysTrue: true,
        },
      });
    });

    test('should show BigInt correctly', async () => {
      await page.goto(`http://localhost:${port}${endpoint}`);
      await typeOperationText(`{ bigint }`);
      await page.click('.graphiql-execute-button');
      const resultContents = await waitForResult();

      expect(resultContents).toMatchObject({
        data: {
          bigint: BigInt('112345667891012345'),
        },
      });
    });
    test('should show live queries correctly', async () => {
      await page.goto(`http://localhost:${port}${endpoint}`);
      await typeOperationText(`query @live { liveCounter }`);
      await page.click('.graphiql-execute-button');

      await new Promise(res => setTimeout(res, 50));

      const resultJson = await waitForResult();

      expect(resultJson).toEqual({
        data: {
          liveCounter: 1,
        },
        isLive: true,
      });
      liveQueryStore.invalidate('Query.liveCounter');

      await page.waitForFunction(() => {
        const value = window.document
          .querySelector('.graphiql-response .CodeMirror-code')
          ?.textContent?.trim()
          .replaceAll('\u00A0', ' ');

        return value?.includes('2');
      });

      const resultJson1 = await waitForResult();
      expect(resultJson1).toEqual({
        data: {
          liveCounter: 2,
        },
        isLive: true,
      });
    });
  });

  describe('GraphiQL with custom options', () => {
    let customGraphQLEndpoint: string;

    const schemaWithDescription = createTestSchema();
    schemaWithDescription.description = 'Here is the custom docs for schema';

    const defaultHeader = '{"Authorization":"Bearer test-auth-header"}';
    const customServer = createServer(
      createYoga({
        schema: schemaWithDescription,
        logging: false,
        graphqlEndpoint: endpoint,
        graphiql: {
          title: 'GraphiQL Custom title here',
          headers: defaultHeader,
        },
        renderGraphiQL,
      }),
    );

    beforeAll(async () => {
      await new Promise<void>(resolve => customServer.listen(0, resolve));
      const port = (customServer.address() as AddressInfo).port;
      customGraphQLEndpoint = `http://localhost:${port}${endpoint}`;
    });

    afterAll(async () => {
      await new Promise(resolve => customServer.close(resolve));
    });

    it('should show custom title', async () => {
      await page.goto(customGraphQLEndpoint);

      const title = await page.evaluate(() => document.title);

      expect(title).toBe('GraphiQL Custom title here');
    });

    it('should show custom schema docs', async () => {
      await page.goto(customGraphQLEndpoint);

      await showGraphiQLSidebar();
      const docsElement = await page.waitForSelector('.graphiql-markdown-description');

      expect(docsElement).not.toBeNull();
      const docs = await getElementText(docsElement!);

      expect(docs).toBe(schemaWithDescription.description);
    });

    it('should include default header', async () => {
      await page.goto(customGraphQLEndpoint);

      await page.evaluate(() => {
        const tabs = Array.from(
          document.querySelectorAll('.graphiql-editor-tools button'),
        ) as HTMLButtonElement[];
        tabs.find(tab => tab.textContent === 'Headers')!.click();
      });

      const headerContentEl = await page.waitForSelector(
        'section.graphiql-editor-tool .graphiql-editor:not(.hidden) pre.CodeMirror-line',
      );

      expect(headerContentEl).not.toBeNull();
      const headerContent = await getElementText(headerContentEl!);

      expect(headerContent).toBe(defaultHeader);
    });
  });

  describe('CORS', () => {
    let anotherServer: Server;
    let anotherOriginPort: number;
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
                    const response = await fetch('http://localhost:${port}${endpoint}', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        query: '{ alwaysTrue }',
                      }),
                    });
                    document.getElementById('result').innerHTML = await response.text();
                  } catch (e) {
                    document.getElementById('result').innerHTML = e.stack;
                  }
                }
                fetchData();
              </script>
            </body>
          </html>
        `);
      });
      await new Promise<void>(resolve => anotherServer.listen(0, () => resolve()));
      anotherOriginPort = (anotherServer.address() as AddressInfo).port;
    });
    afterAll(async () => {
      await new Promise<void>(resolve => anotherServer.close(() => resolve()));
    });
    test('allow other origins by default', async () => {
      await page.goto(`http://localhost:${anotherOriginPort}`);
      const result = await page.evaluate(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return document.getElementById('result')?.innerHTML;
      });
      expect(result).toEqual(
        JSON.stringify({
          data: {
            alwaysTrue: true,
          },
        }),
      );
    });
    test('allow if specified', async () => {
      cors = {
        origin: [`http://localhost:${anotherOriginPort}`],
      };
      await page.goto(`http://localhost:${anotherOriginPort}`);
      const result = await page.evaluate(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return document.getElementById('result')?.innerHTML;
      });
      expect(result).toEqual(
        JSON.stringify({
          data: {
            alwaysTrue: true,
          },
        }),
      );
    });
    test('restrict other origins if provided', async () => {
      cors = {
        origin: ['http://localhost:${port}'],
      };
      await page.goto(`http://localhost:${anotherOriginPort}`);
      const result = await page.evaluate(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return document.getElementById('result')?.innerHTML;
      });
      expect(result).toContain('Failed to fetch');
    });
    test('send specific origin back to user if credentials are set true', async () => {
      cors = {
        origin: [`http://localhost:${anotherOriginPort}`],
        credentials: true,
      };
      await page.goto(`http://localhost:${anotherOriginPort}`);
      const result = await page.evaluate(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return document.getElementById('result')?.innerHTML;
      });
      expect(result).toEqual(
        JSON.stringify({
          data: {
            alwaysTrue: true,
          },
        }),
      );
    });
  });

  describe('EventSource', () => {
    test('subscription operation', async () => {
      await page.goto(`http://localhost:${port}/`);

      const result = await page.evaluate(urlStr => {
        const url = new URL(urlStr);
        url.searchParams.set(
          'query',
          /* GraphQL */ `
            subscription {
              countdown(from: 1)
            }
          `,
        );
        const source = new EventSource(url.toString());

        return new Promise<
          { error: string; data?: never } | { error?: never; data: Array<string> }
        >(res => {
          const values: Array<string> = [];
          source.addEventListener('next', event => {
            values.push(event.data);
          });
          source.addEventListener('complete', () => {
            source.close();
            res({ data: values });
          });
          source.onerror = err => {
            res({ error: String(err) });
          };
        });
      }, `http://localhost:${port}${endpoint}`);

      if (result.error) {
        throw new Error(result.error);
      }

      expect(result.data).toMatchInlineSnapshot(`
        [
          "{"data":{"countdown":1}}",
          "{"data":{"countdown":0}}",
        ]
      `);
    });
  });
});

function sleep<T = void>(
  ms: number,
  onTimeout: (timeout: NodeJS.Timeout) => T = () => {
    return undefined as T;
  },
) {
  return new Promise(resolve => onTimeout(setTimeout(resolve, ms)));
}
