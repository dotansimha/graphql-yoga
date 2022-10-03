/* eslint sort-keys: error */
import { YogaLogo, useTheme, Giscus, defineConfig } from '@theguild/components'
import { useRouter } from 'next/router'

const SITE_NAME = 'GraphQL Yoga'

export default defineConfig({
  chat: {
    link: 'https://discord.gg/94CDTmgmbs',
  },
  docsRepositoryBase:
    'https://github.com/dotansimha/graphql-yoga/tree/v3/website',
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content={`${SITE_NAME}: documentation`} />
      <meta name="og:title" content={`${SITE_NAME}: documentation`} />
    </>
  ),
  logo: (
    <>
      <YogaLogo className="mr-1.5 h-9 w-9" />
      <div>
        <h1 className="md:text-md text-sm font-medium">{SITE_NAME}</h1>
        <h2 className="hidden text-xs sm:block">
          Fully-featured, simple to set up, performant and extendable GraphQL
          JavaScript server
        </h2>
      </div>
    </>
  ),
  main: {
    extraContent() {
      const { resolvedTheme } = useTheme()
      const { route } = useRouter()

      if (route === '/') {
        return null
      }
      return (
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
    },
  },
  titleSuffix: ` – ${SITE_NAME}`,
})
