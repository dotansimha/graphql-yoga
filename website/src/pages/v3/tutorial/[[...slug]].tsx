import Head from 'next/head'
import * as React from 'react'

import {
  DocsContent,
  DocsTOC,
  MDXPage,
  EditOnGitHubButton,
} from '@guild-docs/client'
import { MDXPaths, MDXProps } from '@guild-docs/server'

import { getTutorialV3Routes } from '../../../../routes'
// import { giscus } from '../../../giscus-config'

import type { GetStaticPaths, GetStaticProps } from 'next'

export default MDXPage(
  function PostPage({ content, TOC, MetaHead, sourceFilePath }) {
    return (
      <>
        <Head>{MetaHead}</Head>
        <DocsContent>{content}</DocsContent>
        <DocsTOC>
          <TOC />
          <EditOnGitHubButton
            baseDir="website"
            branch="master"
            sourceFilePath={sourceFilePath}
            repo="dotansimha/graphql-yoga"
          />
        </DocsTOC>
      </>
    )
  },
  // Disable Giscus for now.
  // {
  //   giscus,
  // },
)

export const getStaticProps: GetStaticProps = (ctx) => {
  return MDXProps(
    ({ readMarkdownFile, getArrayParam }) => {
      return readMarkdownFile('v3/tutorial/', getArrayParam('slug'))
    },
    ctx,
    {
      getRoutes: getTutorialV3Routes,
    },
  )
}

export const getStaticPaths: GetStaticPaths = (ctx) => {
  return MDXPaths('v3/tutorial', { ctx })
}
