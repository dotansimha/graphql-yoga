import { HeroGradient, HeroIllustration, IHeroIllustrationProps } from '@theguild/components'
import httpImage from '../public/assets/http.svg'
import ecosystemImage from '../public/assets/ecosystem.svg'
import subscriptionsImage from '../public/assets/subscriptions.svg'
import uploadsImage from '../public/assets/uploads.svg'
import yogaImage from '../public/assets/yogaHome.svg'

export const ITEMS: IHeroIllustrationProps[] = [
  {
    title: 'GraphQL over HTTP compliant',
    description: 'Yoga follows the GraphQL over HTTP specification.',
    image: {
      src: httpImage,
      placeholder: 'empty',
      alt: 'Server over HTTP',
    },
    link: {
      children: 'Learn more',
      title: 'Learn more',
      href: '/docs',
    },
  },
  {
    title: 'Extensible GraphQL Engine powered by Envelop',
    description:
      'Add authentication, caching, error reporting or rate limiting with ease.',
    image: {
      src: ecosystemImage,
      placeholder: 'empty',
      alt: 'Ecosystem',
    },
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
    image: {
      src: subscriptionsImage,
      placeholder: 'empty',
      alt: 'Subscriptions',
    },
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
    image: {
      src: uploadsImage,
      placeholder: 'empty',
      alt: 'Uploads',
    },
    flipped: true,
    link: {
      children: 'Learn more',
      title: 'Learn more',
      href: '/docs/features/file-uploads',
    },
  },
]
import Link from 'next/link'

export default function IndexPage() {
  return (
    <>
      <HeroGradient
        title="Time to Relax with GraphQL Yoga"
        description="The fully-featured GraphQL Server with focus on easy setup, performance and great developer experience."
        link={[
          {
            href: '/docs',
            children: 'Read the docs',
            title: 'Read the Yoga Docs',
          },
          {
            href: '/tutorial/basic',
            children: 'Start the Tutorial',
            title: 'Start the Tutorial',
            style: {
              color: '#fff',
              border: '1px solid #fff',
              background: 'transparent',
            },
          },
        ]}
        colors={['#7433ff', '#1cc8ee']}
        image={{
          src: yogaImage,
          placeholder: 'empty',
          alt: 'Yoga',
        }}
      />
      {ITEMS.map((option) => (
        <HeroIllustration
          key={option.title as string}
          {...option}
          image={{
            ...option.image,
            className: 'h-52 md:h-72',
          }}
        />
      ))}
    </>
  )
}
