import { ComponentProps, FC } from 'react';
import Image from 'next/image';
import { CallToAction, cn, Heading, InfoCard, YogaIcon } from '@theguild/components';
import { InfiniteMovingCards } from './infinite-moving-cards';
import apolloBadge from './icons/apollo-badge.svg';
import safeLineBadge from './icons/safe-line-badge.svg';
import serverLineBadge from './icons/server-line-badge.svg';
import timerLineBadge from './icons/timer-line-badge.svg';

const classes = {
  card: cn('[&_h3]:text-white [&_p]:text-white/80 bg-green-900 rounded-2xl'),
};

export const TrulyExtendableSection: FC<ComponentProps<'section'>> = ({ className, ...props }) => {
  return (
    <section
      className={cn(
        'bg-green-1000 relative isolate overflow-hidden rounded-3xl text-white',
        'p-8 pb-[160px] sm:pb-[112px] md:p-[72px] md:pb-[112px] lg:pb-[72px]',
        className,
      )}
      {...props}
    >
      <div className="relative flex gap-24">
        <div className="w-1/2">
          <Heading as="h2" size="sm">
            Truly extendable
          </Heading>
          <p className="mt-4">
            Highly extendable through Envelop plugins, allowing customization to fit any development
            needs.
          </p>
          <div className="grid grid-cols-2 gap-6 my-12">
            <InfoCard
              heading="Apollo Federation"
              icon={<Image src={apolloBadge} alt="" />}
              className={classes.card}
            >
              Fully supports Apollo Federation for managing complex supergraphs and subgraphs.
            </InfoCard>
            <InfoCard
              heading="Persisted operations"
              icon={<Image src={safeLineBadge} alt="" />}
              className={classes.card}
            >
              Mitigates the risk of arbitrary GraphQL operations with robust persistence
              capabilities.
            </InfoCard>
            <InfoCard
              heading="Response caching"
              icon={<Image src={serverLineBadge} alt="" />}
              className={classes.card}
            >
              Optimizes server performance by caching responses, significantly reducing server load.
            </InfoCard>
            <InfoCard
              heading="Rate limiting"
              icon={<Image src={timerLineBadge} alt="" />}
              className={classes.card}
            >
              Prevents denial of service attacks with advanced rate limiting.
            </InfoCard>
          </div>
          <CallToAction variant="primary" href="/docs/features/envelop-plugins">
            Learn more about Envelop Plugins
          </CallToAction>
        </div>
        <div className="w-1/2 relative group">
          {splitArray(
            ENVELOP_PLUGINS.sort((a, b) => a.title.localeCompare(b.title)),
            7,
          ).map((plugins, index) => (
            <InfiniteMovingCards key={index} direction="right">
              {plugins.map(plugin => (
                <CallToAction
                  key={plugin.title}
                  href={plugin.href}
                  variant="secondary-inverted"
                  target="_blank"
                  rel="noreferrer"
                  className="opacity-60"
                >
                  {plugin.title}
                </CallToAction>
              ))}
            </InfiniteMovingCards>
          ))}
          <YogaIcon
            className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 size-2/3 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none"
            stroke="white"
            strokeWidth="0.2"
            fill="url(#myGradient)"
          />
          <svg>
            <defs>
              <linearGradient id="myGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#86b6c1', stopOpacity: 0.8 }} />
                <stop offset="100%" style={{ stopColor: '#4f96a6', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </section>
  );
};

const ENVELOP_PLUGINS: { title: string; href: `https://${string}` }[] = [
  {
    title: 'useSentry',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/sentry',
  },
  {
    title: 'useStatsD',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/statsd',
  },
  {
    title: 'useSchema',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/core',
  },
  {
    title: 'useSchemaByContext',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/core',
  },
  {
    title: 'useValidationRule',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/core',
  },
  {
    title: 'useErrorHandler',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/core',
  },
  {
    title: 'useMaskedErrors',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/core',
  },
  {
    title: 'useEngine',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/core',
  },
  {
    title: 'useExtendContext',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/core',
  },
  {
    title: 'useImmediateIntrospection',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/immediate-introspection',
  },
  {
    title: 'useLogger',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/core',
  },
  {
    title: 'usePayloadFormatter',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/core',
  },
  {
    title: 'useGraphQLJit',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/graphql-jit',
  },
  {
    title: 'useParserCache',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/parser-cache',
  },
  {
    title: 'useValidationCache',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/validation-cache',
  },
  {
    title: 'useDataLoader',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/dataloader',
  },
  {
    title: 'useApolloTracing',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/apollo-tracing',
  },
  {
    title: 'useApolloDataSources',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/apollo-datasources',
  },
  {
    title: 'useOpenTelemetry',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/opentelemetry',
  },
  {
    title: 'useGenericAuth',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/generic-auth',
  },
  {
    title: 'useAuth0',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/auth0',
  },
  {
    title: 'useGraphQLModules',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/graphql-modules',
  },
  {
    title: 'useRateLimiter',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/rate-limiter',
  },
  {
    title: 'useDisableIntrospection',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/disable-introspection',
  },
  {
    title: 'useFilterAllowedOperations',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/filter-operation-type',
  },
  {
    title: 'usePreloadAssets',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/preload-assets',
  },
  {
    title: 'usePersistedOperations',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/persisted-operations',
  },
  {
    title: 'useHive',
    href: 'https://the-guild.dev/graphql/hive/docs/other-integrations/envelop',
  },
  {
    title: 'useNewRelic',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/newrelic',
  },
  {
    title: 'useLiveQuery',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/live-query',
  },
  {
    title: 'useFragmentArguments',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/fragment-arguments',
  },
  {
    title: 'useApolloServerErrors',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/apollo-server-errors',
  },
  {
    title: 'useOperationFieldPermissions',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/operation-field-permissions',
  },
  {
    title: 'useExtendedValidation',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/extended-validation',
  },
  {
    title: 'usePrometheus',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/prometheus',
  },
  {
    title: 'useContextValuePerExecuteSubscriptionEvent',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/execute-subscription-event',
  },
  {
    title: 'useResourceLimitations',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/resource-limitations',
  },
  {
    title: 'useResponseCache',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/response-cache',
  },
  {
    title: 'useApolloFederation',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/apollo-federation',
  },
  {
    title: 'maxAliasesPlugin',
    href: 'https://escape.tech/graphql-armor/docs/plugins/max-aliases',
  },
  {
    title: 'maxDepthPlugin',
    href: 'https://escape.tech/graphql-armor/docs/plugins/max-depth',
  },
  {
    title: 'maxDirectivesPlugin',
    href: 'https://escape.tech/graphql-armor/docs/plugins/max-directives',
  },
  {
    title: 'maxTokensPlugin',
    href: 'https://escape.tech/graphql-armor/docs/plugins/max-tokens',
  },
  {
    title: 'blockFieldSuggestions',
    href: 'https://escape.tech/graphql-armor/docs/plugins/block-field-suggestions',
  },
  {
    title: 'useInngest',
    href: 'https://github.com/inngest/envelop-plugin-inngest',
  },
  {
    title: 'useDepthLimit',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/depth-limit',
  },
  {
    title: 'useGraphQLMiddleware',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/graphql-middleware',
  },
  {
    title: 'useOnResolve',
    href: 'https://github.com/n1ru4l/envelop/tree/main/packages/plugins/on-resolve',
  },
];

function splitArray<T>(array: T[], parts: number): T[][] {
  const result = [];
  const partSize = Math.ceil(array.length / parts);

  for (let i = 0; i < array.length; i += partSize) {
    result.push(array.slice(i, i + partSize));
  }

  return result;
}
