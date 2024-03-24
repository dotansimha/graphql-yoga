import { ReactElement, ReactNode } from 'react';
import { useRouter } from 'next/router';
import clsx from 'clsx';
import { AiFillAppstore } from 'react-icons/ai';
import { BsCheckCircle, BsFillPlayFill, BsFillSafeFill, BsFillStopwatchFill } from 'react-icons/bs';
import { FiGithub, FiUpload } from 'react-icons/fi';
import { GiHealthNormal } from 'react-icons/gi';
import { GrGraphQl } from 'react-icons/gr';
import { MdCached, MdError } from 'react-icons/md';
import { SiApollographql } from 'react-icons/si';
import { TbPlugConnected } from 'react-icons/tb';
import { Anchor, Image } from '@theguild/components';
import ecosystemImage from '../public/assets/ecosystem.svg';
import httpImage from '../public/assets/http.svg';
import subscriptionsImage from '../public/assets/subscriptions.svg';

const gradients: [string, string][] = [
  ['#8b5cf6', '#6d28d9'], // violet
  ['#06b6d4', '#0e7490'], // cyan
  ['#f59e0b', '#d97706'], // amber
  ['#ec4899', '#db2777'], // pink
];

const classes = {
  button:
    'inline-block bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 text-gray-600 px-6 py-3 rounded-lg font-medium shadow-sm',
  link: 'text-primary-500',
};

function pickGradient(i: number) {
  const gradient = gradients[i % gradients.length];
  if (!gradient) {
    throw new Error('No gradient found');
  }
  return gradient;
}

export function IndexPage(): ReactElement {
  const router = useRouter();
  return (
    <>
      <FeatureWrapper>
        <div className="container py-20 sm:py-24 lg:py-32">
          <h1 className="max-w-screen-md mx-auto font-extrabold text-5xl sm:text-5xl lg:text-6xl text-center bg-gradient-to-r from-purple-700 to-fuchsia-400 dark:from-purple-700 dark:to-fuchsia-400 bg-clip-text text-transparent !leading-tight">
            GraphQL Yoga
          </h1>
          <p className="max-w-screen-sm mx-auto mt-6 text-2xl text-gray-600 text-center dark:text-gray-400">
            The fully-featured GraphQL Server with focus on easy setup, performance and great
            developer experience.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Anchor className={classes.button} href="/docs">
              Documentation
            </Anchor>
            <Anchor className={clsx(classes.button, 'hidden lg:block')} href="/tutorial/basic">
              Tutorial
            </Anchor>
            <Anchor
              className={clsx(classes.button, 'flex flex-row gap-2 items-center')}
              href="https://github.com/dotansimha/graphql-yoga"
            >
              <FiGithub /> GitHub
            </Anchor>
          </div>
        </div>
      </FeatureWrapper>

      <Feature
        gradient={3}
        image={subscriptionsImage}
        title="Great Defaults"
        description={
          <div className="flex flex-col gap-y-12">
            <div>
              <p>practice Yoga while working with GraphQL Yoga</p>
            </div>
            <div className="flex flex-col gap-y-12">
              <FeatureHighlights
                textColor={gradients[3][0]}
                highlights={[
                  {
                    link: '/docs/features/parsing-and-validation-caching',
                    icon: <AiFillAppstore size={36} />,
                    title: 'Parse and validate cache',
                    description: 'Fast requests by caching intensive operations',
                  },
                  {
                    link: '/docs/features/error-masking',
                    icon: <MdError size={36} />,
                    title: 'Error masking',
                    description: 'Never leak sensitive information through errors',
                  },
                  {
                    link: '/docs/features/health-check',
                    icon: <GiHealthNormal size={36} />,
                    title: 'Health checks',
                    description:
                      'Ping the server for liveliness check and/or supply a custom readiness check',
                  },
                  {
                    link: '/docs/features/graphiql',
                    icon: <GrGraphQl size={36} />,
                    title: 'GraphiQL',
                    description: 'In-browser IDE for writing, validating, and testing operations',
                  },
                ]}
              />
            </div>
          </div>
        }
      />

      <Feature
        flipped
        gradient={4}
        image={httpImage}
        title="Super Extendable"
        description={
          <div className="flex flex-col gap-y-12">
            <div>
              <p>
                because GraphQL Yoga is powered by{' '}
                <Anchor href="https://the-guild.dev/graphql/envelop" className={classes.link}>
                  Envelop
                </Anchor>{' '}
                you can use{' '}
                <Anchor href="/docs/features/envelop-plugins" className={classes.link}>
                  any plugin
                </Anchor>
              </p>
            </div>
            <div className="flex flex-col gap-y-12">
              <FeatureHighlights
                textColor={gradients[0][0]}
                highlights={[
                  {
                    link: '/docs/features/apollo-federation',
                    icon: <SiApollographql size={36} />,
                    title: 'Apollo Federation',
                    description: (
                      <>
                        The{' '}
                        <button
                          className={classes.link}
                          onClick={e => {
                            e.preventDefault();
                            router.push('/docs/comparison#compatibility-with-apollo-federation');
                          }}
                        >
                          best supergraph and subgraph
                        </button>{' '}
                        for your GraphQL
                      </>
                    ),
                  },
                  {
                    link: '/docs/features/persisted-operations',
                    icon: <BsFillSafeFill size={36} />,
                    title: 'Persisted operations',
                    description: 'Prevent execution of arbitrary GraphQL operations',
                  },
                  {
                    link: '/docs/features/response-caching',
                    icon: <MdCached size={36} />,
                    title: 'Response caching',
                    description: 'Reducing server load by caching operation results',
                  },
                  {
                    link: 'https://the-guild.dev/graphql/envelop/plugins/use-rate-limiter',
                    title: 'Rate limiting',
                    icon: <BsFillStopwatchFill size={36} />,
                    description: 'Prevent denial of service attacks with ease',
                  },
                ]}
              />
            </div>
          </div>
        }
      />

      <Feature
        gradient={1}
        image={ecosystemImage}
        title="Everything HTTP"
        description={
          <div className="flex flex-col gap-y-12">
            <div>
              <p>
                following the{' '}
                <Anchor href="https://graphql.github.io/graphql-over-http" className={classes.link}>
                  GraphQL over HTTP specification
                </Anchor>
              </p>
            </div>
            <div className="flex flex-col gap-y-12">
              <FeatureHighlights
                textColor={gradients[1][0]}
                highlights={[
                  {
                    icon: <BsCheckCircle size={36} />,
                    title: 'Passes all audits',
                    description: (
                      <>
                        Tested using the graphql-http library.{' '}
                        <Anchor
                          href="https://github.com/enisdenjo/graphql-http/blob/master/implementations/graphql-yoga/README.md"
                          className={classes.link}
                        >
                          See the report
                        </Anchor>{' '}
                        for more info.
                      </>
                    ),
                  },
                  {
                    icon: <TbPlugConnected size={36} />,
                    title: 'Subscriptions',
                    description: (
                      <>
                        Built-in GraphQL{' '}
                        <Anchor href="/docs/features/subscriptions" className={classes.link}>
                          Subscriptions over Server-Sent Events
                        </Anchor>
                        .
                      </>
                    ),
                  },
                  {
                    icon: <FiUpload size={36} />,
                    title: 'File uploads',
                    description: (
                      <>
                        Through GraphQL out-of-the box leveraging the{' '}
                        <Anchor
                          href="https://github.com/jaydenseric/graphql-multipart-request-spec"
                          className={classes.link}
                        >
                          GraphQL multipart request specification
                        </Anchor>
                        .
                      </>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        }
      />

      <Feature title="Runs Everywhere" description="supports many environments" gradient={2}>
        <div
          className="flex justify-center max-w-screen-lg p-12 mx-auto rounded-3xl"
          style={{
            backgroundImage: `linear-gradient(70deg, ${pickGradient(2)[0]}, ${pickGradient(2)[1]})`,
          }}
        >
          <div className="flex flex-wrap">
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
            ].map(env => (
              <div className="p-2 sm:w-1/2 md:w-1/3 w-full" key={env.name}>
                <Anchor href={env.href}>
                  <div className="bg-amber-100 dark:bg-amber-800 rounded flex p-4 h-full items-center gap-2">
                    <BsFillPlayFill
                      className="w-6 h-6 flex-shrink-0 mr-4"
                      style={{ fill: pickGradient(2)[0] }}
                    />
                    <span className="title-font font-medium text-black dark:text-white">
                      {env.name}
                    </span>
                  </div>
                </Anchor>
              </div>
            ))}
          </div>
        </div>
      </Feature>
    </>
  );
}

function FeatureWrapper({ children }: { children: ReactNode }): ReactElement {
  return (
    <div
      className={`
        w-full py-24
        odd:bg-gray-50
        odd:dark:bg-gray-900
        even:bg-white
        even:dark:bg-black
      `}
    >
      {children}
    </div>
  );
}

function Feature({
  title,
  description,
  children,
  image,
  gradient,
  flipped,
}: {
  children?: ReactNode;
  title: string;
  description: ReactNode;
  highlights?: {
    title: string;
    description: ReactNode;
    icon?: ReactNode;
  }[];
  image?: string;
  gradient: number;
  flipped?: boolean;
}) {
  const [start, end] = pickGradient(gradient);

  return (
    <FeatureWrapper>
      <div className="container box-border px-6 mx-auto flex flex-col gap-y-24">
        <div
          className={clsx(
            'flex flex-col gap-24 md:gap-12 lg:gap-24 justify-center items-stretch',
            flipped ? 'md:flex-row-reverse' : 'md:flex-row',
          )}
        >
          <div
            className={clsx(
              'flex flex-col gap-4 w-full md:w-3/5 lg:w-2/5 flex-shrink-0',
              !image && 'items-center',
            )}
          >
            <h2
              className={clsx(
                'font-semibold text-5xl bg-clip-text text-transparent dark:text-transparent leading-normal',
                !image && 'text-center',
              )}
              style={{
                backgroundImage: `linear-gradient(-70deg, ${end}, ${start})`,
              }}
            >
              {title}
            </h2>
            <div className="text-lg text-gray-600 dark:text-gray-400 leading-7">{description}</div>
          </div>
          {image && (
            <div
              className="rounded-3xl overflow-hidden p-8 flex-grow flex flex-col justify-center items-stretch relative"
              style={{
                backgroundImage: `linear-gradient(70deg, ${start}, ${end})`,
              }}
            >
              <Image src={image} className="rounded-xl mx-auto" placeholder="empty" alt={title} />
            </div>
          )}
        </div>
        {children}
      </div>
    </FeatureWrapper>
  );
}

function FeatureHighlights({
  highlights,
  textColor,
}: {
  textColor?: string;
  highlights?: {
    title: string;
    description: ReactNode;
    icon?: ReactNode;
    link?: string;
  }[];
}) {
  if (!Array.isArray(highlights)) {
    return null;
  }

  return (
    <>
      {highlights.map(({ title, description, icon, link }) => {
        const Comp = link ? Anchor : 'div';
        return (
          <Comp
            key={title}
            className="flex flex-row md:flex-col lg:flex-row flex-1 gap-4"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...(link && ({ href: link } as any))}
          >
            {icon && (
              <div className="flex-shrink-0" style={textColor ? { color: textColor } : {}}>
                {icon}
              </div>
            )}
            <div className="text-black dark:text-white">
              <h3
                className={clsx('text-xl font-semibold', !icon && 'text-lg')}
                style={textColor ? { color: textColor } : {}}
              >
                {title}
              </h3>
              <p className={clsx('text-gray-600 dark:text-gray-400', !icon && 'text-sm')}>
                {description}
              </p>
            </div>
          </Comp>
        );
      })}
    </>
  );
}
