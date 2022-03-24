import { js, css } from './graphiql'

export const renderGraphiQL = (opts?: YogaGraphiQLOptions) => /* HTML */ `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>${opts?.title || 'Yoga GraphiQL'}</title>
      <link rel="icon" href="https://www.graphql-yoga.com/favicon.ico" />
      <style>
        ${css}
      </style>
    </head>
    <body id="body" class="no-focus-outline">
      <noscript>You need to enable JavaScript to run this app.</noscript>
      <div id="root"></div>

      <script>
        // Polyfills until we can change DataLoader
        if (globalThis.window?.setImmediate == null) {
          //@ts-ignore
          globalThis.window.setImmediate = setTimeout
          globalThis.global = globalThis
        }
      </script>
      <script type="module">
        ${js}
        renderYogaGraphiQL(
          window.document.querySelector('#root'),
          ${JSON.stringify(opts ?? {})},
        )
      </script>
    </body>
  </html>
`

export type YogaGraphiQLOptions = {
  /**
   * An optional GraphQL string to use when no query is provided and no stored
   * query exists from a previous session.  If undefined is provided, GraphiQL
   * will use its own default query.
   */
  defaultQuery?: string
  /**
   * Whether to open the variable editor by default. Defaults to `true`.
   */
  defaultVariableEditorOpen?: boolean
  /**
   * The endpoint requests should be sent. Defaults to `"/graphql"`.
   */
  endpoint?: string
  /**
   * The initial headers to render inside the header editor. Defaults to `"{}"`.
   */
  headers?: string
  /**
   * More info there: https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials
   * @Default include.
   */
  credentials?: RequestCredentials
  /**
   * Whether the header editor is enabled. Defaults to `true`.
   */
  headerEditorEnabled?: boolean
  /**
   * The title to display at the top of the page. Defaults to `"YogaGraphiQL"`.
   */
  title?: string
}
