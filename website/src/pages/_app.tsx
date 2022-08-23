import Script from 'next/script'
import { AppProps } from 'next/app'
import { FooterExtended, Header, ThemeProvider } from '@theguild/components'
import { useGoogleAnalytics } from 'guild-docs'
import 'guild-docs/style.css'

export default function App({ Component, pageProps }: AppProps) {
  const googleAnalytics = useGoogleAnalytics({ trackingId: 'G-246BWRER3C' })

  return (
    <ThemeProvider>
      <Script async src="https://the-guild.dev/static/crisp.js" />
      <Header
        accentColor="#1cc8ee"
        themeSwitch
        searchBarProps={{ version: 'v2' }}
      />
      <Script {...googleAnalytics.loadScriptProps} />
      <Script {...googleAnalytics.configScriptProps} />
      <Component {...pageProps} />
      <FooterExtended />
    </ThemeProvider>
  )
}

// const defaultSeo: AppSeoProps = {
//   title: 'GraphQL Yoga',
//   description:
//     'Fully-featured, simple to set up, performant and extendable GraphQL NodeJS (JavaScript/TypeScript) server',
//   logo: {
//     url: 'https://www.graphql-yoga.com/banner.svg',
//     width: 200,
//     height: 350,
//   },
//   openGraph: {
//     images: [
//       {
//         url: 'https://www.graphql-yoga.com/cover.png',
//         width: 1280,
//         height: 720,
//       },
//     ],
//   },
// }
