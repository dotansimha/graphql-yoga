export function isGraphqlEndpoint(url: string, graphqlEndpoint: string) {
  const urlWithoutQuery = url.split('?')[0]
  const normalizedUrl = urlWithoutQuery.replace(/\/$/, '')

  return normalizedUrl.endsWith(graphqlEndpoint)
}
