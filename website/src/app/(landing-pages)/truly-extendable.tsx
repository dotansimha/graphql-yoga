import { ComponentProps, FC } from 'react';
import Image from 'next/image';
import { cn, Heading, InfoCard, CallToAction } from '@theguild/components';
import errorWarningBadge from './icons/error-warning-badge.svg';

const classes = {
  card: cn('[&_h3]:text-white [&_p]:text-white/80 bg-green-900 rounded-2xl')
}

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
          <p className='mt-4'>
            Highly extendable through Envelop plugins, allowing customization to fit any development
            needs.
          </p>
          <div className='grid grid-cols-2 gap-6 my-12'>
            <InfoCard
              heading="Apollo Federation"
              icon={<Image src={errorWarningBadge} alt="" />}
              className={classes.card}
            >
              Fully supports Apollo Federation for managing complex supergraphs and subgraphs.
            </InfoCard>
            <InfoCard
              heading="Persisted operations"
              icon={<Image src={errorWarningBadge} alt="" />}
              className={classes.card}
            >
              Mitigates the risk of arbitrary GraphQL operations with robust persistence capabilities.
            </InfoCard>
            <InfoCard
              heading="Response caching"
              icon={<Image src={errorWarningBadge} alt="" />}
              className={classes.card}
            >
              Optimizes server performance by caching responses, significantly reducing server load.
            </InfoCard>
            <InfoCard
              heading="Rate limiting"
              icon={<Image src={errorWarningBadge} alt="" />}
              className={classes.card}
            >
              Prevents denial of service attacks with advanced rate limiting.
            </InfoCard>
          </div>
          <CallToAction variant="primary" href="/docs/features/envelop-plugins">
            Learn more about Envelop Plugins
          </CallToAction>
        </div>
        <div className='bg-red-500 basis-1/2'>

        </div>
      </div>
    </section>
  );
};
