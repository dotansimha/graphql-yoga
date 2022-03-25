import { HeroGradient, HeroIllustration } from '@theguild/components'
import { handlePushRoute } from '@guild-docs/client'
import { useMemo } from 'react'
import { ILink } from '@theguild/components/dist/types/components'
import styled from '@emotion/styled'

const Wrapper = styled.div`
  @media only screen and (min-width: 500px) {
    & img {
      margin-top: 8%;
      margin-right: 6%;
    }
  }
  @media only screen and (max-width: 500px) {
    & img {
      display: none !important;
    }
    & div {
      padding-bottom: 0.1rem;
    }
  }
`

interface featuresOptions {
  title: string
  description: string
  imageSrc: string
  imageAlt: string
  flipped?: boolean
  link?: ILink
}
const buttonStyle: React.CSSProperties = {
  color: 'white',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '144px',
  height: '40px',
  borderRadius: '6px',
  backgroundColor: '#1CC8EE',
  justifyContent: 'center',
}

export default function Index() {
  const ITEMS = useMemo<featuresOptions[]>(
    () => [
      {
        title: 'GraphQL over HTTP compliant',
        description: 'Yoga follows the GraphQL over HTTP specification.',
        imageSrc: '/assets/http.svg',
        imageAlt: 'Server over HTTP',
        link: {
          children: 'Learn more',
          title: 'Learn more',
          href: '/docs/quick-start',
          onClick: (e) => handlePushRoute('/docs/quick-start', e),
          style: buttonStyle,
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
          onClick: (e) => handlePushRoute('/docs/features/envelop-plugins', e),
          style: buttonStyle,
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
          onClick: (e) => handlePushRoute('/docs/features/subscriptions', e),
          style: buttonStyle,
        },
      },
      {
        title: 'Handle file uploads with GraphQL',
        description:
          'Simply enable uploads and start accepting files for GraphQL mutations. No additional packages needed!',
        imageSrc: '/assets/uploads.svg',
        imageAlt: 'Uploads',
        flipped: true,
        link: {
          children: 'Learn more',
          title: 'Learn more',
          href: '/docs/features/file-uploads',
          onClick: (e) => handlePushRoute('/docs/features/file-uploads', e),
          style: buttonStyle,
        },
      },
    ],
    [],
  )
  return (
    <>
      <Wrapper>
        <HeroGradient
          title="Time to Relax with GraphQL Yoga"
          description={`The fully-featured GraphQL Server with focus on easy setup, performance and great developer experience.`}
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
          colors={['#7433FF', '#1CC8EE']}
          image={{
            src: '/assets/yogaHome.svg',
            alt: 'Yoga',
          }}
        />
      </Wrapper>
      {ITEMS.map((option) => {
        return (
          <>
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
          </>
        )
      })}
    </>
  )
}
