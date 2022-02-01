import {
  renderGraphiQL,
  YogaGraphiQLOptions,
} from '@graphql-yoga/render-graphiql'

export function shouldRenderGraphiQL({ headers, method }: Request): boolean {
  return method === 'GET' && !!headers?.get('accept')?.includes('text/html')
}

export { renderGraphiQL, YogaGraphiQLOptions as GraphiQLOptions }
