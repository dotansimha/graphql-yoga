import 'remark-admonitions/styles/infima.css'
import '../../public/style.css'

import { appWithTranslation } from 'next-i18next'
import Script from 'next/script'

import { Box, extendTheme, theme as chakraTheme } from '@chakra-ui/react'
import { mode } from '@chakra-ui/theme-tools'
import {
  ExtendComponents,
  handlePushRoute,
  CombinedThemeProvider,
  DocsPage,
  AppSeoProps,
} from '@guild-docs/client'
import {
  Header,
  Subheader,
  Instruction,
  FooterExtended,
} from '@theguild/components'

import type { AppProps } from 'next/app'
import React from 'react'

import { useGoogleAnalytics } from '../google-analytics'

import '@algolia/autocomplete-theme-classic'
import '@theguild/components/dist/static/css/SearchbarV2.css'

ExtendComponents({
  Instruction: (props: React.ComponentProps<typeof Instruction>) => (
    <Box mt={4}>
      <Instruction>{props.children}</Instruction>
    </Box>
  ),
})

const styles: typeof chakraTheme['styles'] = {
  global: (props) => ({
    body: {
      bg: mode('white', 'gray.850')(props),
    },
  }),
}

const theme = extendTheme({
  colors: {
    gray: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      850: '#1b1b1b',
      900: '#171717',
    },
  },
  fonts: {
    heading: 'TGCFont, sans-serif',
    body: 'TGCFont, sans-serif',
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  styles,
})

const accentColor = '#1cc8ee'

const serializedMdx = process.env.SERIALIZED_MDX_ROUTES
const mdxRoutes = { data: serializedMdx && JSON.parse(serializedMdx) }

const serializedTutorialMdx = process.env.SERIALIZED_TUTORIAL_MDX_ROUTES
const tutorialMdxRoutes = {
  data: serializedTutorialMdx && JSON.parse(serializedTutorialMdx),
}

function AppContent(appProps: AppProps) {
  const { Component, pageProps, router } = appProps
  const googleAnalytics = useGoogleAnalytics({
    router,
    trackingId: 'G-246BWRER3C',
  })

  const isDocs = router.asPath.startsWith('/docs')
  const isTutorial = router.asPath.startsWith('/tutorial')

  return (
    <>
      <Header
        accentColor={accentColor}
        activeLink="/open-source"
        themeSwitch
        searchBarProps={{ version: 'v2' }}
      />
      <Script {...googleAnalytics.loadScriptProps} />
      <Script {...googleAnalytics.configScriptProps} />
      <Subheader
        activeLink={router.asPath}
        product={{
          title: 'Yoga',
          description:
            'Fully-featured, simple to set up, performant and extendable GraphQL JavaScript server',
          image: {
            src: '/assets/logo.svg',
            alt: 'Docs',
          },
          onClick: (e) => handlePushRoute('/', e),
        }}
        links={[
          {
            children: 'Home',
            title: 'GraphQL Yoga',
            href: '/',
            onClick: (e) => handlePushRoute('/', e),
          },
          {
            children: 'Documentation',
            title: 'Documentation',
            href: '/docs',
            onClick: (e) => handlePushRoute('/docs', e),
          },
          {
            children: 'Tutorial',
            title: 'Tutorial',
            href: '/tutorial',
            onClick: (e) => handlePushRoute('/tutorial', e),
          },
          {
            children: 'GitHub',
            title: "Head to project's GitHub",
            href: 'https://github.com/dotansimha/graphql-yoga',
            target: '_blank',
            rel: 'noopener noreferrer',
          },
        ]}
        cta={{
          children: 'Get Started',
          title: 'Get started',
          href: '/docs',
          onClick: (e) => handlePushRoute('/docs/quick-start', e),
        }}
      />
      {isDocs ? (
        <DocsPage
          appProps={appProps}
          accentColor={accentColor}
          mdxRoutes={mdxRoutes}
        />
      ) : isTutorial ? (
        <DocsPage
          appProps={appProps}
          accentColor={accentColor}
          mdxRoutes={tutorialMdxRoutes}
          docsTitleProps={{
            children: 'Tutorial',
          }}
        />
      ) : (
        <Component {...pageProps} />
      )}
      <FooterExtended />
    </>
  )
}

const AppContentWrapper = appWithTranslation(function TranslatedApp(appProps) {
  return <AppContent {...appProps} />
})

const defaultSeo: AppSeoProps = {
  title: 'GraphQL Yoga',
  description:
    'Fully-featured, simple to set up, performant and extendable GraphQL NodeJS (JavaScript/TypeScript) server',
  logo: {
    url: 'https://graphql-yoga.vercel.app/banner.svg',
    width: 200,
    height: 350,
  },
}

export default function App(appProps: AppProps) {
  return (
    <CombinedThemeProvider
      theme={theme}
      accentColor={accentColor}
      defaultSeo={defaultSeo}
    >
      <AppContentWrapper {...appProps} />
    </CombinedThemeProvider>
  )
}
