/* eslint-disable react-hooks/rules-of-hooks -- false positive, useMDXComponents are not react hooks */
import { notFound } from 'next/navigation';
import { Callout, LegacyPackageCmd, NextPageProps } from '@theguild/components';
import {
  compileMdx,
  convertToPageMap,
  evaluate,
  mergeMetaWithPageMap,
  normalizePageMap,
} from '@theguild/components/server';
import json from '../../../../remote-files/v2.json';
import { useMDXComponents } from '../../../mdx-components';
// @ts-expect-error -- add types for .mdx
import LegacyDocsBanner from '../../legacy-docs-banner.mdx';

const { branch, docsPath, filePaths, repo, user } = json;

const { mdxPages, pageMap: _pageMap } = convertToPageMap({
  filePaths,
  basePath: 'v2',
});

// @ts-expect-error -- ignore
const v2Pages = _pageMap[0].children;

const yogaPageMap = mergeMetaWithPageMap(v2Pages, {
  index: 'Quick Start',
  features: {
    items: {
      graphiql: 'GraphiQL',
      context: 'GraphQL Context',
      'error-masking': '',
      subscriptions: '',
      'file-uploads': '',
      'envelop-plugins': '',
      testing: '',
      'apollo-federation': '',
      cors: '',
    },
  },
  integrations: {
    items: {
      'integration-with-aws-lambda': 'AWS Lambda',
      'integration-with-cloudflare-workers': 'Cloudflare Workers',
      'integration-with-deno': 'Deno',
      'integration-with-express': 'Express',
      'integration-with-fastify': 'Fastify',
      'integration-with-koa': 'Koa',
      'integration-with-nestjs': 'NestJS',
      'integration-with-nextjs': 'Next.js',
      'integration-with-sveltekit': 'SvelteKit',
      'z-other-environments': 'Other Environments',
    },
  },
  migration: {
    items: {
      'migration-from-apollo-server': 'Apollo Server',
      'migration-from-express-graphql': 'Express GraphQL',
      'migration-from-yoga-v1': 'Yoga v1',
    },
  },
});

export const pageMap = normalizePageMap(yogaPageMap);

const { wrapper: Wrapper, ...components } = useMDXComponents({
  Callout,
  PackageCmd: LegacyPackageCmd,
});

export default async function Page(props: NextPageProps<'...slug'>) {
  const params = await props.params;
  const route = (params.slug || []).join('/');
  const filePath = mdxPages[route];

  if (!filePath) {
    notFound();
  }
  const response = await fetch(
    `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${docsPath}${filePath}`,
  );
  const data = await response.text();
  const rawJs = await compileMdx(data, { filePath });
  const { default: MDXContent, toc, metadata } = evaluate(rawJs, components);

  return (
    <Wrapper toc={toc} metadata={metadata}>
      <LegacyDocsBanner yogaVersion={2} />
      <MDXContent />
    </Wrapper>
  );
}

export function generateStaticParams() {
  const params = Object.keys(mdxPages).map(route => ({
    slug: route.split('/')
  }))
  return params;
}
