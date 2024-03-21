import { GetStaticPaths, GetStaticProps } from 'next'
import { buildDynamicMDX, buildDynamicMeta } from 'nextra/remote'
import { defaultRemarkPlugins } from '@theguild/components/next.config'
import json from '../../remote-files/v2.json' assert { type: 'json' }
import { remarkLinkRewrite } from '@theguild/components/compile';
;
const { user, repo, branch, docsPath, filePaths } = json

export const getStaticPaths: GetStaticPaths = async () => ({
  fallback: 'blocking',
  paths: filePaths
    // this fix `TOO MANY REDIRECTS` error in CF
    .map((filePath) => filePath.replace(/\/?index\.mdx?$/, ''))
    .map((filePath) => ({
      params: { slug: filePath.replace(/\.mdx?$/, '').split('/') },
    })),
})

export const getStaticProps: GetStaticProps<
  {
    __nextra_dynamic_mdx: string
    __nextra_dynamic_opts: string
  },
  { slug?: string[] }
> = async ({ params }) => {
  const path = params?.slug?.join('/') ?? 'index'
  const foundPath = filePaths.find((filePath) => filePath.startsWith(path))

  const baseURL = `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${docsPath}${foundPath}`
  const response = await fetch(baseURL)
  const data = await response.text()

  const mdx = await buildDynamicMDX(data, {
    defaultShowCopyCode: true,
    mdxOptions: {
      remarkPlugins: [
        ...defaultRemarkPlugins,
        [remarkLinkRewrite, { pattern: /^\/docs(\/.*)?$/, replace: '/v2$1' }],
      ],
    },
  })

  return {
    props: {
      ...mdx,
      ...(await buildDynamicMeta()),
    },
  }
}
