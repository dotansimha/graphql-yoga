export function shouldRenderGraphiQL({ headers, method }: Request): boolean {
  return method === 'GET' && !!headers?.get('accept')?.includes('text/html')
}
export {
  renderGraphiQL,
  RenderGraphiQLOptions as GraphiQLOptions,
} from 'graphql-helix'
