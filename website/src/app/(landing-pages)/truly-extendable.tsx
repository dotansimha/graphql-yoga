import { ComponentProps, FC } from 'react';
import Image from 'next/image';
import { CallToAction, cn, Heading, InfoCard, YogaIcon } from '@theguild/components';
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
        <div className="basis-1/2">
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
          <YogaIcon
            className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 size-2/3"
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
        <div className="basis-1/2 relative"></div>
      </div>
      {splitResult.map((plugins, index) => (
        <InfiniteMovingCards
          key={index}
          direction="right"
          speed="slow"
          className="mx-auto"
          pauseOnHover={false}
        >
          {plugins
            .map(plugin => (
              <div key={plugin} className="bg-green-900 rounded-lg px-4 py-3 text-green-600">
                {plugin}
              </div>
            ))
          }
        </InfiniteMovingCards>
      ))}
    </section>
  );
};

const ENVELOP_PLUGINS = [
  'useSentry',
  'useStatsD',
  'useSchema',
  'useSchemaByContext',
  'useValidationRule',
  'useErrorHandler',
  'useMaskedErrors',
  'useEngine',
  'useExtendContext',
  'useImmediateIntrospection',
  'useLogger',
  'usePayloadFormatter',
  'useGraphQLJit',
  'useParserCache',
  'useValidationCache',
  'useDataLoader',
  'useApolloTracing',
  'useApolloDataSources',
  'useOpenTelemetry',
  'useGenericAuth',
  'useAuth0',
  'useGraphQLModules',
  'useRateLimiter',
  'useDisableIntrospection',
  'useFilterAllowedOperations',
  'usePreloadAssets',
  'usePersistedOperations',
  'useHive',
  'useNewRelic',
  'useLiveQuery',
  'useFragmentArguments',
  'useApolloServerErrors',
  'useOperationFieldPermissions',
  'useExtendedValidation',
  'usePrometheus',
  'useContextValuePerExecuteSubscriptionEvent',
  'useResourceLimitations',
  'useResponseCache',
  'useApolloFederation',
  'maxAliasesPlugin',
  'maxDepthPlugin',
  'maxDirectivesPlugin',
  'maxTokensPlugin',
  'blockFieldSuggestions',
  'useInngest',
];
function splitArray(array: unknown[], parts: number) {
  const result = [];
  const partSize = Math.ceil(array.length / parts);

  for (let i = 0; i < array.length; i += partSize) {
    result.push(array.slice(i, i + partSize));
  }

  return result;
}

const parts = 5;
const splitResult = splitArray(ENVELOP_PLUGINS, parts);


