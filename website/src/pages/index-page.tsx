import { HeroGradient, HeroIllustration } from '@theguild/components'
import { handlePushRoute } from 'guild-docs'

export const ITEMS = [
  {
    title: 'GraphQL over HTTP compliant',
    description: 'Yoga follows the GraphQL over HTTP specification.',
    imageSrc: '/assets/http.svg',
    imageAlt: 'Server over HTTP',
    link: {
      children: 'Learn more',
      title: 'Learn more',
      href: '/docs/quick-start',
    },
  },
  {
    title: 'Extensible GraphQL Engine powered by Envelop',
    description:
      'Add authentication, caching, error reporting or rate limiting with ease.',
    imageSrc: '/assets/ecosystem.svg',
    imageAlt: 'Ecosystem',
    flipped: true,
    link: {
      children: 'Learn more',
      title: 'Learn more',
      href: '/docs/features/envelop-plugins',
    },
  },
  {
    title: 'GraphQL Subscriptions over HTTP',
    description:
      'Run GraphQL Subscriptions over HTTP instead of WebSockets via Server Sent Events.',
    imageSrc: '/assets/subscriptions.svg',
    imageAlt: 'Subscriptions',
    link: {
      children: 'Learn more',
      title: 'Learn more',
      href: '/docs/features/subscriptions',
    },
  },
  {
    title: 'Handle file uploads with GraphQL',
    description:
      'Enable file uploads using GraphQL mutations with no additional packages needed.',
    imageSrc: '/assets/uploads.svg',
    imageAlt: 'Uploads',
    flipped: true,
    link: {
      children: 'Learn more',
      title: 'Learn more',
      href: '/docs/features/file-uploads',
    },
  },
]

export default function IndexPage() {
  return (
    <>
      <HeroGradient
        title="Time to Relax with GraphQL Yoga"
        description="The fully-featured GraphQL Server with focus on easy setup, performance and great developer experience."
        link={[
          {
            href: '/docs/quick-start',
            children: 'Read the docs',
            title: 'Read the Yoga Docs',
            onClick: (e) => handlePushRoute('/docs/quick-start', e),
          },
          {
            href: '/docs/tutorial',
            children: 'Start the Tutorial',
            title: 'Start the Tutorial',
            onClick: (e) => handlePushRoute('/tutorial', e),
            style: {
              color: '#fff',
              border: '1px solid #fff',
              background: 'transparent',
            },
          },
        ]}
        colors={['#7433ff', '#1cc8ee']}
        image={{
          src: '/assets/yogaHome.svg',
          alt: 'Yoga',
        }}
      />

      {ITEMS.map((option) => (

        <HeroIllustration
          key={option.title}
          title={option.title}
          description={option.description}
          image={{
            src: option.imageSrc,
            alt: option.imageAlt,
          }}
          flipped={option.flipped}
          link={option.link}
        />
      ))}
    </>
  )
}
