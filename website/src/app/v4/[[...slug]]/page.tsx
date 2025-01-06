import { notFound } from 'next/navigation';
import { Callout, NextPageProps, Tabs } from '@theguild/components';
import { defaultNextraOptions } from '@theguild/components/next.config';
import {
  compileMdx,
  convertToPageMap,
  evaluate,
  mergeMetaWithPageMap,
  normalizePageMap,
} from '@theguild/components/server';
import json from '../../../../remote-files/v4.json';
import { useMDXComponents } from '../../../mdx-components';
import CodegenCallout from '../../codegen-callout.mdx';
import LegacyDocsBanner from '../../legacy-docs-banner.mdx';
import { Giscus } from '../../giscus'

const { branch, docsPath, filePaths, repo, user } = json;

const { mdxPages, pageMap: _pageMap } = convertToPageMap({
  filePaths,
  basePath: 'v4',
});

// @ts-expect-error -- ignore
const v4Pages = _pageMap[0].children;

const yogaPageMap = mergeMetaWithPageMap(v4Pages, {
  index: 'Quick Start',
  features: {
    items: {
      schema: 'GraphQL Schema',
      graphiql: 'GraphiQL',
      context: 'GraphQL Context',
      'error-masking': '',
      introspection: '',
      subscriptions: '',
      'file-uploads': '',
      'defer-stream': 'Defer and Stream',
      'request-batching': '',
      cors: '',
      'csrf-prevention': 'CSRF Prevention',
      'parsing-and-validation-caching': '',
      'response-caching': '',
      'persisted-operations': '',
      'automatic-persisted-queries': '',
      'logging-and-debugging': '',
      'health-check': '',
      'sofa-api': 'REST API',
      cookies: '',
      'apollo-federation': '',
      'envelop-plugins': 'Plugins',
      testing: '',
      jwt: '',
    },
  },
  integrations: {
    items: {
      'integration-with-aws-lambda': 'AWS Lambda',
      'integration-with-cloudflare-workers': 'Cloudflare Workers',
      'integration-with-gcp': 'Google Cloud Platform',
      'integration-with-deno': 'Deno',
      'integration-with-express': 'Express',
      'integration-with-fastify': 'Fastify',
      'integration-with-koa': 'Koa',
      'integration-with-nestjs': 'NestJS',
      'integration-with-nextjs': 'Next.js',
      'integration-with-sveltekit': 'SvelteKit',
      'integration-with-hapi': 'Hapi',
      'integration-with-bun': 'Bun',
      'integration-with-uwebsockets': 'µWebSockets.js',
      'z-other-environments': 'Other Environments',
    },
  },
  migration: {
    items: {
      'migration-from-apollo-server': 'Apollo Server',
      'migration-from-express-graphql': 'Express GraphQL',
      'migration-from-yoga-v1': 'Yoga v1',
      'migration-from-yoga-v2': 'Yoga v2',
      'migration-from-yoga-v3': 'Yoga v3',
    },
  },
});

export const pageMap = normalizePageMap(yogaPageMap);

const { wrapper: Wrapper, ...components } = useMDXComponents({
  $Tabs: Tabs,
  Callout,
  CodegenCallout,
  Tab: Tabs.Tab,
  Tabs,
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
  const rawJs = await compileMdx(data, { filePath, ...defaultNextraOptions });
  const { default: MDXContent, toc, metadata } = evaluate(rawJs, components);

  return (
    <Wrapper
      toc={toc}
      metadata={metadata}
      data-version="v4"
      // https://pagefind.app/docs/filtering/#capturing-a-filter-value-from-an-attribute
      data-pagefind-filter="version[data-version]"
      bottomContent={<Giscus />}
    >
      <LegacyDocsBanner yogaVersion={4} />
      <MDXContent />
    </Wrapper>
  );
}

export function generateStaticParams() {
  const params = Object.keys(mdxPages).map(route => ({
    slug: route.split('/'),
  }));
  return params;
}
