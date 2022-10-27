/* eslint sort-keys: error */
import { useTheme, Giscus, defineConfig, YogaLogo } from '@theguild/components'
import { useRouter } from 'next/router'

const siteName = 'GraphQL Yoga'

export default defineConfig({
  chat: {
    link: 'https://discord.gg/94CDTmgmbs',
  },
  docsRepositoryBase:
    'https://github.com/dotansimha/graphql-yoga/tree/v3/website',
  getNextSeoProps() {
    return {
      openGraph: {
        images: [{ url: 'https://the-guild.dev/graphql/yoga-server/cover.png' }]
      }
    }
  },
  logo: (
    <>
      <YogaLogo className="mr-1.5 h-9 w-9" />
      <div>
        <h1 className="md:text-md text-sm font-medium">{siteName}</h1>
        <h2 className="hidden text-xs sm:block">
          Fully-featured, simple to set up, performant and extendable GraphQL
          JavaScript server
        </h2>
      </div>
    </>
  ),
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
        {children}
        {comments}
      </>
    )
  },
  siteName,
})
