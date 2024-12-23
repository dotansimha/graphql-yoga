import { ReactNode } from 'react';
import Image from 'next/image';
import {
  CallToAction,
  CheckIcon,
  cn,
  DecorationIsolation,
  FrequentlyAskedQuestions,
  GetYourAPIGameRightSection,
  GitHubIcon,
  Heading,
  YogaIcon,
} from '@theguild/components';
import FAQ from './faq.mdx';
import { metadata as rootMetadata } from './layout';
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

      <FrequentlyAskedQuestions faqPages={['/']}>
        <FAQ />
      </FrequentlyAskedQuestions>
      <GetYourAPIGameRightSection className="mx-4 sm:mb-6 md:mx-6" />
    </Page>
  );
}
