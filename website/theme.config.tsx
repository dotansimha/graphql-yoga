/* eslint sort-keys: error */
import {
  YogaLogo,
  DocsThemeConfig,
  FooterExtended,
  Header,
  Navbar,
} from '@theguild/components'
// @ts-ignore -- TODO: @laurin why I get TS2307: Cannot find module '@theguild/components/giscus' or its corresponding type declarations.
import type { Giscus } from '@theguild/components/giscus'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'

const SITE_NAME = 'GraphQL Yoga'

const Comments = dynamic(
  // @ts-ignore
  () => import('@theguild/components/giscus').then((m) => m.Giscus),
  { ssr: false },
) as Giscus

const config: DocsThemeConfig = {
  titleSuffix: ` – ${SITE_NAME}`,
  project: {
    link: 'https://github.com/dotansimha/graphql-yoga', // GitHub link in the navbar
  },
  docsRepositoryBase:
    'https://github.com/dotansimha/graphql-yoga/tree/master/website/src/pages', // base URL for the docs repository
  search: {
    component: null,
  },
  footer: {
    component: <FooterExtended />,
  },
  editLink: {
    text: 'Edit this page on GitHub',
  },
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
  chat: {
    link: 'https://discord.gg/94CDTmgmbs',
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content={`${SITE_NAME}: documentation`} />
      <meta name="og:title" content={`${SITE_NAME}: documentation`} />
    </>
  ),
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
  sidebar: {
    defaultMenuCollapsed: true,
  },
  feedback: {
    content: 'Question? Give us feedback →',
    labels: 'kind/docs',
  },
  main: {
    extraContent() {
      const { route } = useRouter()
      if (route.startsWith('/docs') || route.startsWith('/tutorial')) {
        return (
          <Comments
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
}

export default config
