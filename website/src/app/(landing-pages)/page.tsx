import { ReactNode } from 'react';
import Image from 'next/image';
import {
  CallToAction,
  CheckIcon,
  cn,
  DecorationIsolation,
  ExploreMainProductCards,
  FrequentlyAskedQuestions,
  GetYourAPIGameRightSection,
  GitHubIcon,
  Heading,
  InfoCard,
  ToolsAndLibrariesCards,
  YogaIcon,
} from '@theguild/components';
import { metadata as rootMetadata } from '../layout';
import FAQ from './faq.mdx';
import { ReachZenQuickerWithYoga } from './reach-zen-quicker-with-yoga';
import { ListItemAnchor, RunAnywhereSection } from './runs-anywhere';
import arrowUpBade from './arrow-up-badge.svg';
import checkBadge from './check-badge.svg';
import errorWarningBadge from './error-warning-badge.svg';
import graphqlBadge from './graphql-badge.svg';
import manInBlackClothingPracticingYoga from './man-in-black-clothing-practicing-yoga-minimalistic.png';
import pulseLineBadge from './pulse-line-badge.svg';
import puzzleBadge from './puzzle-badge.svg';
import yogaHeroBadge from './yoga-badge.svg';

export const metadata = {
  title: 'Home',
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

function Hero(props: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'relative isolate flex max-w-[90rem] flex-col items-center justify-center gap-6 overflow-hidden rounded-3xl bg-blue-400 px-4 py-6 sm:py-12 md:gap-8 lg:py-24',
        props.className,
      )}
    >
      <DecorationIsolation className="-z-10">
        <YogaIcon
          className={cn(
            'absolute right-[-180px] top-[calc(50%-180px)] size-[360px] fill-[url(#codegen-hero-gradient)] stroke-white/10 stroke-[0.1px] md:hidden xl:block',
            'lg:left-[-250px] lg:top-1/2 lg:-translate-y-1/2 lg:size-[500px]',
          )}
        />
        <YogaIcon className="absolute right-[-150px] top-2 size-[672px] fill-[url(#codegen-hero-gradient)] stroke-white/10 stroke-[0.1px] max-md:hidden" />
        <svg>
          <defs>
            <linearGradient id="codegen-hero-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="11.66%" stopColor="rgba(255, 255, 255, 0.10)" />
              <stop offset="74.87%" stopColor="rgba(255, 255, 255, 0.30)" />
            </linearGradient>
          </defs>
        </svg>
      </DecorationIsolation>
      <Image priority src={yogaHeroBadge.src} alt="" width="96" height="96" />
      {props.children}
    </div>
  );
}

function HeroLinks(props: { children: ReactNode }) {
  return (
    <div className="relative z-10 flex justify-center gap-2 px-0.5 max-sm:flex-col sm:gap-4">
      {props.children}
    </div>
  );
}

function HeroFeatures(props: { children: ReactNode }) {
  return (
    <ul className="mx-auto flex list-none gap-x-6 gap-y-2 text-sm font-medium max-md:flex-col [&>li]:flex [&>li]:items-center [&>li]:gap-2">
      {props.children}
    </ul>
  );
}

function Page(props: { children: ReactNode; className?: string }) {
  return <div className={cn('flex h-full flex-col', props.className)}>{props.children}</div>;
}

export default function IndexPage() {
  return (
    <Page className="mx-auto max-w-[90rem]">
      <Hero className="mx-4 max-sm:mt-2 md:mx-6">
        <Heading as="h1" size="xl" className="mx-auto max-w-3xl text-balance text-center">
          Yoga — High-performance GraphQL Server
        </Heading>
        <p className="mx-auto w-[512px] max-w-[80%] text-center leading-6 text-green-800">
          Fully-featured GraphQL server designed for effortless setup and optimal developer
          experience.
        </p>
        <HeroFeatures>
          <li>
            <CheckIcon className="text-green-800" />
            Fully open source
          </li>
          <li>
            <CheckIcon className="text-green-800" />
            No vendor lock
          </li>
          <li>
            <CheckIcon className="text-green-800" />
            Can be self-hosted!
          </li>
        </HeroFeatures>
        <HeroLinks>
          <CallToAction variant="primary" href="/docs">
            Get started
          </CallToAction>
          <CallToAction variant="secondary-inverted" href="/changelog">
            Changelog
          </CallToAction>
          <CallToAction variant="tertiary" href="https://github.com/dotansimha/graphql-yoga">
            <GitHubIcon className="size-6" />
            GitHub
          </CallToAction>
        </HeroLinks>
      </Hero>

      <ExploreMainProductCards />

      <section className="flex gap-6 lg:gap-24 px-4 xl:px-[120px]">
        <div className="grow">
          <Heading as="h2" size="md">
            Practice Yoga while doing server-work
          </Heading>
          <p className="text-green-800 mt-4">
            Yoga ensures optimal configuration out-of-the-box, enhancing performance and developer
            workflow.
          </p>
          <div className="flex my-12 gap-8">
            <InfoCard
              heading="Error masking"
              icon={<Image src={errorWarningBadge} alt="" />}
              className="flex-1 md:p-0 bg-transparent"
            >
              Enhance security by masking errors to prevent sensitive data leaks.
            </InfoCard>
            <InfoCard
              heading="Health checks"
              icon={<Image src={pulseLineBadge} alt="" />}
              className="flex-1 md:p-0 bg-transparent"
            >
              Built-in health checks to ensure server vitality and readiness.
            </InfoCard>
            <InfoCard
              heading="GraphiQL Integration"
              icon={<Image src={graphqlBadge} alt="" />}
              className="flex-1 md:p-0 bg-transparent"
            >
              In-browser IDE for seamless writing, validation, and testing of GraphQL operations.
            </InfoCard>
          </div>
          <CallToAction variant="primary" href="/docs">
            Learn more
          </CallToAction>
        </div>
        <div className="basis-5/12 shrink-0 relative">
          <Image
            src={manInBlackClothingPracticingYoga}
            alt="Man in black clothing practicing yoga"
            className="rounded-3xl h-full object-cover"
          />
          <YogaIcon
            className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 size-2/3"
            stroke="white"
            stroke-width="0.2"
            fill="none"
          />
        </div>
      </section>
      <br />
      <div className="bg-red-500 shrink-0">
        TODO:
        <br />
        Truly extendable
      </div>

      <EnterpriseFocusedCards />

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

      <ReachZenQuickerWithYoga className="mt-28" />

      <ToolsAndLibrariesCards className="mx-4 mt-6 md:mx-6" />
      <FrequentlyAskedQuestions faqPages={['/']}>
        <FAQ />
      </FrequentlyAskedQuestions>
      <GetYourAPIGameRightSection className="mx-4 sm:mb-6 md:mx-6" />
    </Page>
  );
}

function EnterpriseFocusedCards({ className }: { className?: string }) {
  return (
    <section className={cn('px-4 py-6 sm:py-12 md:px-6 lg:py-16 xl:px-[120px]', className)}>
      <Heading as="h2" size="md" className="text-balance sm:px-6 sm:text-center">
        Everything HTTP
      </Heading>
      <p className="text-green-800 text-center mt-4">
        Complies with the latest GraphQL over HTTP specifications for full compatibility.
      </p>
      <ul className="mt-6 flex flex-wrap justify-center gap-2 md:mt-16 md:gap-6">
        <InfoCard
          as="li"
          heading="Fully audited"
          icon={<Image src={checkBadge} alt="" />}
          className="flex-1 rounded-2xl md:rounded-3xl"
        >
          Meets rigorous standards as confirmed by comprehensive graphql-http library audits.
        </InfoCard>
        <InfoCard
          as="li"
          heading="Subscriptions"
          icon={<Image src={puzzleBadge} alt="" />}
          className="flex-1 basis-full rounded-2xl md:basis-0 md:rounded-3xl"
        >
          Supports real-time communications with built-in GraphQL Subscriptions over Server-Sent
          Events.
        </InfoCard>
        <InfoCard
          as="li"
          heading="File Uploads"
          icon={<Image src={arrowUpBade} alt="" />}
          className="flex-1 basis-full rounded-2xl md:rounded-3xl lg:basis-0"
        >
          Facilitates file uploads directly through GraphQL using the multipart request
          specification.
        </InfoCard>
      </ul>
    </section>
  );
}
