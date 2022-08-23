import { YogaLogo, DocsThemeConfig } from '@theguild/components'
// @ts-ignore -- TODO: @laurin why I get TS2307: Cannot find module 'guild-docs/giscus' or its corresponding type declarations.
import type { Giscus } from 'guild-docs/giscus'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'

const SITE_NAME = 'GraphQL Yoga'

const Comments = dynamic(
  // @ts-ignore
  () => import('guild-docs/giscus').then((m) => m.Giscus),
  { ssr: false },
) as Giscus

const config: DocsThemeConfig = {
  titleSuffix: ` – ${SITE_NAME}`,
  projectLink: 'https://github.com/dotansimha/graphql-yoga', // GitHub link in the navbar
  docsRepositoryBase:
    'https://github.com/dotansimha/graphql-yoga/tree/master/website/src/pages', // base URL for the docs repository
  nextLinks: true,
  prevLinks: true,
  search: false,
  floatTOC: true,
  darkMode: true,
  footer: false,
  footerEditLink: 'Edit this page on GitHub',
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
  head: () => (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content={`${SITE_NAME}: documentation`} />
      <meta name="og:title" content={`${SITE_NAME}: documentation`} />
    </>
  ),
  gitTimestamp: 'Last updated on',
  defaultMenuCollapsed: true,
  feedbackLink: 'Question? Give us feedback →',
  feedbackLabels: 'kind/docs',
  bodyExtraContent() {
    const { route } = useRouter()
    if (!route.startsWith('/docs') && !route.startsWith('/tutorial')) {
      return null
    }
    return (
      <Comments
        repo="dotansimha/graphql-yoga"
        repoId="MDEwOlJlcG9zaXRvcnkxMTA4MTk5Mzk="
        category="Docs Discussion"
        categoryId="DIC_kwDOBpr6Y84CAquY"
      />
    )
  },
}

export default config
