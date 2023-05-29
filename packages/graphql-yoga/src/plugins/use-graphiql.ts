import { PromiseOrValue } from '@envelop/core'
import graphiqlHTML from '../graphiql-html.js'
import { YogaLogger } from '@graphql-yoga/logger'
import { FetchAPI } from '../types.js'
import { Plugin } from './types.js'

export function shouldRenderGraphiQL({ headers, method }: Request): boolean {
  return method === 'GET' && !!headers?.get('accept')?.includes('text/html')
}

export type GraphiQLOptions = {
  /**
   * An optional GraphQL string to use when no query is provided and no stored
   * query exists from a previous session.  If undefined is provided, GraphiQL
   * will use its own default query.
   */
  defaultQuery?: string
  /**
   * The initial headers to render inside the header editor. Defaults to `"{}"`.
   * The value should be a JSON encoded string, for example:
   * `headers: JSON.stringify({Authorization: "Bearer your-auth-key"})`
   */
  headers?: string
  /**
   * More info there: https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials
   */
  credentials?: RequestCredentials
  /**
   * The title to display at the top of the page. Defaults to `"Yoga GraphiQL"`.
   */
  title?: string
  /**
   * Protocol for subscriptions
   */
  subscriptionsProtocol?: 'SSE' | 'GRAPHQL_SSE' | 'WS' | 'LEGACY_WS'
  /**
   * Extra headers you always want to pass with users' headers input
   */
  additionalHeaders?: Record<string, string>
}

export type GraphiQLRendererOptions = {
  /**
   * The endpoint requests should be sent. Defaults to `"/graphql"`.
   */
  endpoint?: string
} & GraphiQLOptions

export const renderGraphiQL = (opts: GraphiQLRendererOptions) =>
  graphiqlHTML
    .replace('__TITLE__', opts?.title || 'Yoga GraphiQL')
    .replace('__OPTS__', JSON.stringify(opts ?? {}))

export type GraphiQLOptionsFactory<TServerContext> = (
  request: Request,
  // eslint-disable-next-line @typescript-eslint/ban-types
  ...args: {} extends TServerContext
    ? [serverContext?: TServerContext | undefined]
    : [serverContext: TServerContext]
) => PromiseOrValue<GraphiQLOptions | boolean>

export type GraphiQLOptionsOrFactory<TServerContext> =
  | GraphiQLOptions
  | GraphiQLOptionsFactory<TServerContext>
  | boolean

export interface GraphiQLPluginConfig<TServerContext> {
  graphqlEndpoint: string
  options?: GraphiQLOptionsOrFactory<TServerContext>
  render?(options: GraphiQLRendererOptions): PromiseOrValue<BodyInit>
  logger?: YogaLogger
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useGraphiQL<TServerContext extends Record<string, any>>(
  config: GraphiQLPluginConfig<TServerContext>,
  // eslint-disable-next-line @typescript-eslint/ban-types
): Plugin<{}, TServerContext> {
  const logger = config.logger ?? console
  let graphiqlOptionsFactory: GraphiQLOptionsFactory<TServerContext>
  if (typeof config?.options === 'function') {
    graphiqlOptionsFactory = config?.options
  } else if (typeof config?.options === 'object') {
    graphiqlOptionsFactory = () => config?.options as GraphiQLOptions
  } else if (config?.options === false) {
    graphiqlOptionsFactory = () => false
  } else {
    graphiqlOptionsFactory = () => ({})
  }

  const renderer = config?.render ?? renderGraphiQL
  let urlPattern: URLPattern
  const getUrlPattern = ({ URLPattern }: FetchAPI) => {
    urlPattern ||= new URLPattern({
      pathname: config.graphqlEndpoint,
    })
    return urlPattern
  }
  return {
    async onRequest({ request, serverContext, fetchAPI, endResponse, url }) {
      if (
        shouldRenderGraphiQL(request) &&
        (request.url.endsWith(config.graphqlEndpoint) ||
          url.pathname === config.graphqlEndpoint ||
          getUrlPattern(fetchAPI).test(url))
      ) {
        logger.debug(`Rendering GraphiQL`)
        const graphiqlOptions = await graphiqlOptionsFactory(
          request,
          serverContext as TServerContext,
        )

        if (graphiqlOptions) {
          const graphiQLBody = await renderer({
            ...(graphiqlOptions === true ? {} : graphiqlOptions),
          })

          const response = new fetchAPI.Response(graphiQLBody, {
            headers: {
              'Content-Type': 'text/html',
            },
            status: 200,
          })
          endResponse(response)
        }
      }
    },
  }
}
