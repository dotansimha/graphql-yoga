import { GetStaticProps } from 'next';
// @ts-expect-error I have no idea for the reason of this error. I am just the guy that has to fix the broken eslint setup.
import { buildDynamicMDX, buildDynamicMeta } from 'nextra/remote';
// @ts-expect-error Comes from components
import { remarkLinkRewrite } from '@theguild/components/compile';
// @ts-expect-error Comes from components
import { defaultRemarkPlugins } from '@theguild/components/next.config';
import json from '../../remote-files/v4.json' with { type: 'json' };

const { user, repo, branch, docsPath, filePaths } = json;

export const getStaticProps: GetStaticProps<
  {
    __nextra_dynamic_mdx: string;
    __nextra_dynamic_opts: string;
  },
  { slug?: string[] }
> = async ({ params }) => {
  const path = params?.slug?.join('/') ?? 'index';
  const foundPath = filePaths.find(filePath => filePath.startsWith(path));

  const baseURL = `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${docsPath}${foundPath}`;
  const response = await fetch(baseURL);
  const data = await response.text();

  const mdx = await buildDynamicMDX(data, {
    defaultShowCopyCode: true,
    mdxOptions: {
      remarkPlugins: [
        ...defaultRemarkPlugins,
        [remarkLinkRewrite, { pattern: /^\/docs(\/.*)?$/, replace: '/v2$1' }],
      ],
    },
  });

  return {
    props: {
      ...mdx,
      ...(await buildDynamicMeta()),
    },
  };
};
