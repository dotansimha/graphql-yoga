import { createGraphQLError, Plugin, YogaInitialContext } from 'graphql-yoga';

export interface CSRFPreventionPluginOptions {
  /**
   * List of headers that are required to be set on every request.
   *
   * @default 'x-graphql-yoga-csrf'
   */
  requestHeaders?: string[];
}

/**
 * If you have CORS enabled, almost all requests coming from the browser will have a
 * preflight request - however, some requests are deemed "simple" and don't make a preflight.
 *
 * One example of such a request is a good ol' GET request without any headers, this request can
 * be marked as "simple" and have preflight CORS checks skipped therefore skipping the CORS check.
 *
 * This attack can be mitigated by saying: "all GET requests must have a custom header set". This
 * would force all clients to manipulate the headers of GET requests, marking them as "_not-_simple"
 * and therefore always executing a preflight request.
 */
export function useCSRFPrevention(
  options: CSRFPreventionPluginOptions = {},
): Plugin<YogaInitialContext> {
  const { requestHeaders = ['x-graphql-yoga-csrf'] } = options;
  return {
    async onRequestParse({ request }) {
      if (!requestHeaders.some(headerName => request.headers.has(headerName))) {
        throw createGraphQLError('Required CSRF header(s) not present', {
          extensions: {
            http: {
              status: 403,
            },
          },
        });
      }
    },
  };
}
