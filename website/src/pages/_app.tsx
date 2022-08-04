import Script from 'next/script'
import { AppProps } from 'next/app'
import { FooterExtended, Header, ThemeProvider } from '@theguild/components'
import { useGoogleAnalytics } from 'guild-docs'
import 'guild-docs/style.css'

const accentColor = '#1cc8ee'

export default function App({ Component, pageProps, router }: AppProps) {
  const googleAnalytics = useGoogleAnalytics({
    router,
    trackingId: 'G-246BWRER3C',
  })

  const isDocs = router.asPath.startsWith('/docs')
  const isTutorial = router.asPath.startsWith('/tutorial')

  // @ts-expect-error -- getLayout is custom function from nextra
  const { getLayout = (page) => page } = Component
  return (
    <ThemeProvider>
      <Script async src="https://the-guild.dev/static/crisp.js" />
      <Header
        accentColor={accentColor}
        themeSwitch
        searchBarProps={{ version: 'v2' }}
      />
      <Script {...googleAnalytics.loadScriptProps} />
      <Script {...googleAnalytics.configScriptProps} />
      {/* @ts-ignore */}
      {getLayout(<Component {...pageProps} />)}
      <FooterExtended />
    </ThemeProvider>
  )
}
