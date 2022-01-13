import Head from 'next/head'
import * as React from 'react'

import { DocsContent, DocsTOC, MDXPage } from '@guild-docs/client'
import { MDXPaths, MDXProps } from '@guild-docs/server'
import Script from 'next/script'

import { getRoutes } from '../../../routes'

import type { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'

export default MDXPage(function PostPage({
  content,
  TOC,
  MetaHead,
  BottomNavigation,
}) {
  return (
    <>
      <Head>{MetaHead}</Head>
      <DocsContent>
        {content}
        <div style={{ height: 10 }} />
        <Giscus />
      </DocsContent>
      <DocsTOC>
        <TOC />
        <BottomNavigation />
      </DocsTOC>
    </>
  )
})

export const getStaticProps: GetStaticProps = (ctx) => {
  return MDXProps(
    ({ readMarkdownFile, getArrayParam }) => {
      return readMarkdownFile('docs/', getArrayParam('slug'))
    },
    ctx,
    {
      getRoutes,
    },
  )
}

export const getStaticPaths: GetStaticPaths = (ctx) => {
  return MDXPaths('docs', { ctx })
}

function Giscus() {
  const router = useRouter()
  React.useEffect(() => {
    const iframe = document.querySelector<HTMLIFrameElement>(
      'iframe.giscus-frame',
    )
    iframe?.contentWindow?.postMessage(
      { giscus: { setConfig: { term: router.asPath.split('?')[0] } } },
      'https://giscus.app',
    )
  }, [router.asPath])

  return (
    <>
      <Script
        src="https://giscus.app/client.js"
        data-repo="dotansimha/graphql-yoga"
        data-repo-id="MDEwOlJlcG9zaXRvcnkxMTA4MTk5Mzk="
        data-category="Docs Discussion"
        data-category-id="DIC_kwDOBpr6Y84CAquY"
        data-mapping="pathname"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-theme="preferred_color_scheme"
        data-lang="en"
        crossOrigin="anonymous"
        async
      />
      <div className="giscus" />
    </>
  )
}
