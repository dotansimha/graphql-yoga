/* eslint-disable react-hooks/rules-of-hooks -- false positive, useMDXComponents are not react hooks */

import fs from 'fs/promises';
import fg from 'fast-glob';
import { visitParents } from 'unist-util-visit-parents';
import { NextPageProps } from '@theguild/components';
import {
  compileMdx,
  convertToPageMap,
  evaluate,
  mergeMetaWithPageMap,
  normalizePageMap,
} from '@theguild/components/server';
import { defaultNextraOptions } from '@theguild/components/server/next.config';
import { useMDXComponents } from '../../../mdx-components';

async function getPackages() {
  const result = await fg(['../packages/**/package.json'], {
    ignore: ['../**/node_modules/**', '../**/dist/**'],
  });
  return result.map(r =>
    r.split('/').slice(
      // remove ../packages
      2,
      // remove package.json
      -1,
    ),
  );
}

export async function generateStaticParams() {
  const result = await getPackages();
  return result.map(slug => ({ slug }));
}

const { pageMap: _pageMap } = convertToPageMap({
  filePaths: (await getPackages()).map(slug => slug.join('/')),
  basePath: 'changelogs',
});

// @ts-expect-error
const changelogsPages = _pageMap[0].children;

const changelogsPageMap = mergeMetaWithPageMap(changelogsPages, {
  // Put Yoga at top
  'graphql-yoga': '',
});

export const pageMap = normalizePageMap(changelogsPageMap);

export async function generateMetadata(props: NextPageProps<'...slug'>) {
  // const params = await props.params;
  // const { metadata } = await importPage(params.mdxPath);
  return {};
}

const { wrapper: Wrapper, ...components } = useMDXComponents();

const remarkRemoveUpdatedDependency = () => ast => {
  visitParents(ast, 'text', (node, ancestors) => {
    if (
      node.value.startsWith('Updated dependencies') ||
      node.value.startsWith('Updated dependency')
    ) {
      for (let i = ancestors.length - 1; i >= 0; i--) {
        if (ancestors[i].type === 'list') {
          ancestors[i].children = [];
          break;
        }
      }
    }
  });
};

export default async function Page(props: NextPageProps<'...slug'>) {
  const params = await props.params;
  const filePath = `../packages/${params.slug.join('/')}/CHANGELOG.md`;
  const content = await fs.readFile(filePath, 'utf8');

  const rawJs = await compileMdx(content, {
    filePath,
    ...defaultNextraOptions,
    mdxOptions: {
      ...defaultNextraOptions.mdxOptions,
      remarkPlugins: [remarkRemoveUpdatedDependency],
    },
  });

  const { default: MDXContent, toc, metadata } = evaluate(rawJs, components);
  return (
    <Wrapper toc={toc} metadata={metadata}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  );
}
