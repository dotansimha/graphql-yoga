/* eslint sort-keys: error */
import { useTheme, Giscus, defineConfig, Callout } from '@theguild/components'
import { useRouter } from 'next/router'
import Link from 'next/link'
import * as React from 'react'

export default defineConfig({
  chat: {
    link: 'https://discord.gg/94CDTmgmbs',
  },
  docsRepositoryBase:
    'https://github.com/dotansimha/graphql-yoga/tree/main/website',
  main({ children }) {
    const { resolvedTheme } = useTheme()
    const { route } = useRouter()

    const comments = route !== '/' && (
      <Giscus
        // ensure giscus is reloaded when client side route is changed
        key={route}
        repo="dotansimha/graphql-yoga"
        repoId="MDEwOlJlcG9zaXRvcnkxMTA4MTk5Mzk="
        category="Docs Discussion"
        categoryId="DIC_kwDOBpr6Y84CAquY"
        mapping="pathname"
        theme={resolvedTheme}
      />
    )

    return (
      <>
        {route.startsWith('/v2') && (
          <Callout type="warning">
            This is the documentation for the <b>old</b> GraphQL Yoga version 2.
            We recommend upgrading to the latest GraphQL Yoga version 3.
            <br />
            <br />
            <Link
              href="/docs/migration/migration-from-yoga-v2"
              className="nx-text-primary-600 nx-underline nx-decoration-from-font [text-underline-position:from-font]"
            >
              Get started with GraphQL Yoga v3
            </Link>
          </Callout>
        )}
        {children}
        {comments}
      </>
    )
  },
  siteName: 'YOGA',
})
