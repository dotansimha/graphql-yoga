import Head from 'next/head'
import * as React from 'react'

import { DocsContent, DocsTOC, MDXPage } from '@guild-docs/client'
import { MDXPaths, MDXProps } from '@guild-docs/server'

import { getTutorialRoutes } from '../../../routes'
import { giscus } from '../../giscus-config'

import type { GetStaticPaths, GetStaticProps } from 'next'

export default MDXPage(
  function PostPage({ content, TOC, MetaHead, BottomNavigation }) {
    return (
      <>
        <Head>{MetaHead}</Head>
        <DocsContent>{content}</DocsContent>
        <DocsTOC>
          <TOC />
          <BottomNavigation />
        </DocsTOC>
      </>
    )
  },
  {
    giscus,
  },
)

export const getStaticProps: GetStaticProps = (ctx) => {
  return MDXProps(
    ({ readMarkdownFile, getArrayParam }) => {
      return readMarkdownFile('tutorial/', getArrayParam('slug'))
    },
    ctx,
    {
      getRoutes: getTutorialRoutes,
    },
  )
}

export const getStaticPaths: GetStaticPaths = (ctx) => {
  return MDXPaths('tutorial', { ctx })
}
