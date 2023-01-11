import * as React from 'react'

import Link from 'next/link'

import { Callout } from '@theguild/components'

export function LatestVersionNotice() {
  return (
    <Callout>
      This is the documentation for the <b>old</b> GraphQL Yoga version 2. We recommend upgrading to
      the latest GraphQL Yoga version 3.
      <br />
      <br />
      <Link href="/docs/migration/migration-from-yoga-v2">
        <b>Get started with GraphQL Yoga v3</b>
      </Link>
    </Callout>
  )
}
