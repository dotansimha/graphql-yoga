import { FC } from 'react';
import { Anchor, CallToAction, cn, ComparisonTable, Heading } from '@theguild/components';

export const ReachZenQuickerWithYoga: FC = () => {
  return (
    <div>
      <Heading as="h2" size="md" className="text-balance sm:px-6 sm:text-center text-green-1000">
        Using Apollo Server? Reach zen quicker with Yoga.
      </Heading>
      <div className="mx-4 flex max-lg:flex-col gap-6 lg:gap-24 mt-[64px]">
        <div className="basis-1/4">
          <Heading as="h3" size="sm" className="text-green-1000">
            Runtime&nbsp;Performance Champion
          </Heading>
          <p className="text-green-800 mt-4 mb-6">
            Yoga demonstrates superior performance with lower latency and higher request rates than
            Apollo Server. Benchmarked.
          </p>
          <CallToAction variant="tertiary" href="https://the-guild.dev/graphql/yoga-server/docs/comparison#graphql-yoga-and-apollo-server">
            Detailed Apollo Server Comparison
          </CallToAction>
        </div>

        <ComparisonTable className={cn('grow')}>
          <thead>
            <ComparisonTable.Row>
              {['Name', 'Language', 'Server', 'Latency avg', 'Requests'].map(header => (
                <ComparisonTable.Header className="sm:w-1/4 whitespace-pre" key={header}>
                  {header}
                </ComparisonTable.Header>
              ))}
            </ComparisonTable.Row>
          </thead>

          <tbody>
            {[
              {
                name: 'GraphQL Yoga with Response Cache',
                href: 'https://the-guild.dev/graphql/yoga-server/docs/features/response-caching',
                language: 'Node.js',
                server: 'http',
                latency: '46.54ms',
                requests: '2.2kps',
              },
              {
                name: 'GraphQL Yoga with JIT',
                href: 'https://the-guild.dev/graphql/yoga-server/docs/features/envelop-plugins#envelop-plugin-example',
                language: 'Node.js',
                server: 'http',
                latency: '764.83ms',
                requests: '120ps',
              },
              {
                name: 'GraphQL Yoga',
                href: 'https://github.com/dotansimha/graphql-yoga',
                language: 'Node.js',
                server: 'http',
                latency: '916.90ms',
                requests: '100ps',
              },
              {
                name: 'Apollo Server',
                href: 'https://github.com/apollographql/apollo-server',
                language: 'Node.js',
                server: 'Express',
                latency: '1,234.12ms',
                requests: '64ps',
              },
            ].map(row => {
              const isApollo = row.name === 'Apollo Server'
              return (
                <ComparisonTable.Row
                  key={row.name}
                  className={isApollo ? 'bg-beige-100' : ''}
                >
                  <ComparisonTable.Cell className={isApollo ? '!bg-beige-100' : ''}>
                    <Anchor href={row.href} className="text-green-1000 underline font-medium">
                      {row.name}
                    </Anchor>
                  </ComparisonTable.Cell>
                  <ComparisonTable.Cell>{row.language}</ComparisonTable.Cell>
                  <ComparisonTable.Cell>{row.server}</ComparisonTable.Cell>
                  <ComparisonTable.Cell>{row.latency}</ComparisonTable.Cell>
                  <ComparisonTable.Cell>{row.requests}</ComparisonTable.Cell>
                </ComparisonTable.Row>
              )
            })}
          </tbody>
        </ComparisonTable>
      </div>
    </div>
  );
};
