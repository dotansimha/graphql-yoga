/* eslint sort-keys: error */
import {
  YogaLogo,
  DocsThemeConfig,
  FooterExtended,
  Header,
  Navbar,
  mdxComponents,
  Giscus,
} from '@theguild/components'
import { useRouter } from 'next/router'

const SITE_NAME = 'GraphQL Yoga'

const config: DocsThemeConfig = {
  chat: {
    link: 'https://discord.gg/94CDTmgmbs',
  },
  components: mdxComponents,
  docsRepositoryBase:
    'https://github.com/dotansimha/graphql-yoga/tree/v3/website',
  editLink: {
    text: 'Edit this page on GitHub',
  },
  feedback: {
    content: 'Question? Give us feedback →',
    labels: 'kind/docs',
  },
  footer: {
    component: <FooterExtended />,
  },
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
      const { route } = useRouter()
      if (route.startsWith('/docs') || route.startsWith('/tutorial')) {
        return (
          <Giscus
            repo="dotansimha/graphql-yoga"
            repoId="MDEwOlJlcG9zaXRvcnkxMTA4MTk5Mzk="
            category="Docs Discussion"
            categoryId="DIC_kwDOBpr6Y84CAquY"
          />
        )
      }
      return null
    },
  },
  navbar: (props) => (
    <>
      <Header
        accentColor="#1cc8ee"
        themeSwitch
        searchBarProps={{ version: 'v2' }}
      />
      <Navbar {...props} />
    </>
  ),
  project: {
    link: 'https://github.com/dotansimha/graphql-yoga', // GitHub link in the navbar
  },
  search: {
    component: null,
  },
  sidebar: {
    defaultMenuCollapsed: true,
  },
  titleSuffix: ` – ${SITE_NAME}`,
}

export default config
