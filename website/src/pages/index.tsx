import { HeroGradient, InfoList } from '@theguild/components'
import { handlePushRoute } from '@guild-docs/client'

export default function Index() {
  return (
    <>
      <HeroGradient
        title="GraphQL Yoga"
        description="Fully-featured GraphQL Server with focus on easy setup, performance and great developer experience"
        link={{
          href: '/docs/quick-start',
          children: 'Read the Docs',
          title: 'Read the Yoga Docs',
          onClick: (e) => handlePushRoute('/docs/quick-start', e),
        }}
        // TODO: add it back in when v2 is stable
        // version={<NPMBadge name="graphql-yoga" />}
        colors={['#59BDEF', '#ED2E7E']}
      />

      <InfoList
        title="Features"
        items={[
          {
            title: 'Spec Compliant',
            description: 'GraphQL over HTTP specification-compliant server.',
          },
          {
            title: 'Extensible',
            description:
              "Extend GraphQL Engine's capabilities with Envelop's powerful plugin ecosystem.",
          },
          {
            title: 'Subscriptions over HTTP',
            description:
              'Subscriptions over HTTP instead of WebSockets via Server Sent Events.',
          },
          {
            title: 'Uploads',
            description:
              'Simply enable uploads and start accepting files for GraphQL mutations.',
          },
        ]}
      />
    </>
  )
}
