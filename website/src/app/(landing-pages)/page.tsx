import { ReactNode } from 'react';
import Image from 'next/image';
import NextLink from 'next/link';
import {
  CallToAction,
  cn,
  ExploreMainProductCards,
  // FrequentlyAskedQuestions,
  GitHubIcon,
  Heading,
  Hero,
  InfoCard,
  TextLink,
  ToolsAndLibrariesCards,
  YogaIcon,
} from '@theguild/components';
import { metadata as rootMetadata } from '../layout';
// import FAQ from './faq.mdx';
import { ReachZenQuickerWithYoga } from './reach-zen-quicker-with-yoga';
import { ListItemAnchor, RunAnywhereSection } from './runs-anywhere';
import { TrulyExtendableSection } from './truly-extendable';
import arrowUpBade from './icons/arrow-up-badge.svg';
import checkBadge from './icons/check-badge.svg';
import errorWarningBadge from './icons/error-warning-badge.svg';
import graphqlBadge from './icons/graphql-badge.svg';
import pulseLineBadge from './icons/pulse-line-badge.svg';
import puzzleBadge from './icons/puzzle-badge.svg';
import manInBlackClothingPracticingYoga from './man-in-black-clothing-practicing-yoga-minimalistic.png';

export const metadata = {
  title: 'GraphQL Yoga',
  alternates: {
    // to remove leading slash
    canonical: '.',
  },
  openGraph: {
    ...rootMetadata.openGraph,
    // to remove leading slash
    url: '.',
  },
};

function Page(props: { children: ReactNode; className?: string }) {
  return <div className={cn('flex h-full flex-col', props.className)}>{props.children}</div>;
}

export default function IndexPage() {
  const yogaMan = (
    <>
      <Image
        src={manInBlackClothingPracticingYoga}
        alt="Man in black clothing practicing yoga"
        className="rounded-3xl h-96 lg:h-full object-cover"
      />
      <YogaIcon
        className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 size-2/3"
        stroke="white"
        strokeWidth="0.2"
        fill="none"
      />
    </>
  );

  return (
    <Page className="mx-auto max-w-[90rem]">
      <Hero
        heading="High-performance GraphQL Server"
        text="Fully-featured GraphQL server designed for effortless setup and optimal developer experience."
        logo={<YogaIcon />}
        checkmarks={['Fully open source', 'No vendor lock', 'Can be self-hosted!']}
      >
        <CallToAction variant="primary-inverted" href="/docs">
          Get started
        </CallToAction>
        <CallToAction variant="secondary-inverted" href="/changelog">
          Changelog
        </CallToAction>
        <CallToAction variant="tertiary" href="https://github.com/dotansimha/graphql-yoga">
          <GitHubIcon className="size-6" />
          GitHub
        </CallToAction>
      </Hero>

      <ExploreMainProductCards />
      <EverythingHTTPSection />
      <TrulyExtendableSection className="mt-24" />

      <ReachZenQuickerWithYoga className="my-28" />

      <RunAnywhereSection className="mx-4 md:mx-6">
        {[
          {
            name: 'AWS Lambda',
            href: '/docs/integrations/integration-with-aws-lambda',
          },
          {
            name: 'Cloudflare Workers',
            href: '/docs/integrations/integration-with-cloudflare-workers',
          },
          {
            name: 'Deno',
            href: '/docs/integrations/integration-with-deno',
          },
          {
            name: 'Express',
            href: '/docs/integrations/integration-with-express',
          },
          {
            name: 'Fastify',
            href: '/docs/integrations/integration-with-fastify',
          },
          { name: 'Koa', href: '/docs/integrations/integration-with-koa' },
          {
            name: 'NestJS',
            href: '/docs/integrations/integration-with-nestjs',
          },
          {
            name: 'Next.js',
            href: '/docs/integrations/integration-with-nextjs',
          },
          {
            name: 'SvelteKit',
            href: '/docs/integrations/integration-with-sveltekit',
          },
          { name: 'Bun', href: '/docs/integrations/integration-with-bun' },
          {
            name: '& more...',
            href: '/docs/integrations/z-other-environments',
          },
        ].map(({ name, href }) => (
          <ListItemAnchor key={name} href={href}>
            {name}
          </ListItemAnchor>
        ))}
      </RunAnywhereSection>

      <section className="flex my-24 max-lg:flex-col gap-6 lg:gap-24 px-4 xl:px-[120px]">
        <div className="grow">
          <Heading as="h2" size="md">
            Practice Yoga while doing server-work
          </Heading>
          <p className="text-green-800 mt-4">
            Yoga ensures optimal configuration out-of-the-box, enhancing performance and developer
            workflow.
          </p>
          <div className="relative lg:hidden mt-6">{yogaMan}</div>
          <div className="flex my-12 gap-8 max-sm:flex-col">
            <InfoCard
              // @ts-expect-error
              as={NextLink}
              heading="Error masking"
              icon={<Image src={errorWarningBadge} alt="" />}
              className="flex-1 p-0 md:p-0 bg-transparent hive-focus rounded-md"
              href="/docs/features/error-masking"
            >
              Enhance security by masking errors to prevent sensitive data leaks.
            </InfoCard>
            <InfoCard
              // @ts-expect-error
              as={NextLink}
              heading="Health checks"
              icon={<Image src={pulseLineBadge} alt="" />}
              className="flex-1 p-0 md:p-0 bg-transparent hive-focus rounded-md"
              href="/docs/features/health-check"
            >
              Built-in health checks to ensure server vitality and readiness.
            </InfoCard>
            <InfoCard
              // @ts-expect-error
              as={NextLink}
              heading="GraphiQL Integration"
              icon={<Image src={graphqlBadge} alt="" />}
              className="flex-1 p-0 md:p-0 bg-transparent hive-focus rounded-md"
              href="/docs/features/graphiql"
            >
              In-browser IDE for seamless writing, validation, and testing of GraphQL operations.
            </InfoCard>
          </div>
          <CallToAction variant="primary" href="/docs">
            Learn more
          </CallToAction>
        </div>
        <div className="basis-5/12 shrink-0 relative max-lg:hidden">{yogaMan}</div>
      </section>

      <ToolsAndLibrariesCards className="mx-4 mt-6 md:mx-6" />
      {/* TODO: add later */}
      {/*<FrequentlyAskedQuestions faqPages={['/']}>*/}
      {/*  <FAQ />*/}
      {/*</FrequentlyAskedQuestions>*/}
    </Page>
  );
}

function EverythingHTTPSection({ className }: { className?: string }) {
  return (
    <section className={cn('px-4 py-6 sm:py-12 md:px-6 lg:py-16 xl:px-[120px]', className)}>
      <Heading as="h2" size="md" className="text-balance sm:px-6 sm:text-center">
        Everything HTTP
      </Heading>
      <p className="text-green-800 sm:text-center mt-4">
        Complies with the latest GraphQL over HTTP specifications for full compatibility.
      </p>
      <ul className="mt-6 flex flex-wrap justify-center gap-2 md:mt-16 md:gap-6">
        <InfoCard
          as="li"
          heading="Fully audited"
          icon={<Image src={checkBadge} alt="" />}
          className="flex-1 rounded-2xl md:rounded-3xl"
        >
          Meets rigorous standards as confirmed by comprehensive <br />
          <TextLink
            href="https://github.com/enisdenjo/graphql-http/blob/master/implementations/graphql-yoga/README.md"
            className="mt-4 text-green-800"
          >
            graphql-http library audits
          </TextLink>
          .
        </InfoCard>
        <InfoCard
          as="li"
          heading="Subscriptions"
          icon={<Image src={puzzleBadge} alt="" />}
          className="flex-1 basis-full rounded-2xl md:basis-0 md:rounded-3xl"
        >
          Supports real-time communications with built-in GraphQL{' '}
          <TextLink href="/docs/features/subscriptions" className="mt-4 text-green-800">
            Subscriptions over Server-Sent Events
          </TextLink>
          .
        </InfoCard>
        <InfoCard
          as="li"
          heading="File Uploads"
          icon={<Image src={arrowUpBade} alt="" />}
          className="flex-1 basis-full rounded-2xl md:rounded-3xl lg:basis-0"
        >
          Facilitates file uploads directly through GraphQL using <br />
          <TextLink
            href="https://github.com/jaydenseric/graphql-multipart-request-spec"
            className="mt-4 text-green-800"
          >
            the multipart request specification
          </TextLink>
          .
        </InfoCard>
      </ul>
    </section>
  );
}
