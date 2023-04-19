/* eslint sort-keys: error */
import { useTheme, Giscus, defineConfig } from '@theguild/components'
import { useRouter } from 'next/router'

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
        {children}
        {comments}
      </>
    )
  },
  siteName: 'YOGA',
})
