import Link from 'next/link';
import { useRouter } from 'next/router';
import { Callout, Giscus, useTheme } from '@theguild/components';

const LATEST_VERSION = 5;

function LegacyDocsBanner() {
  const { route } = useRouter();
  const currentVersion = route.split('/')[1].replace('v', '');
  return (
    <Callout type="warning">
      This is the documentation for the <b>old</b> GraphQL Yoga version {currentVersion}. We
      recommend upgrading to the latest GraphQL Yoga version {LATEST_VERSION}.
      <br />
      <br />
      <Link
        href={`/docs/migration/migration-from-yoga-v${currentVersion}`}
        className="_text-primary-600 _underline _decoration-from-font [text-underline-position:from-font]"
      >
        Migrate to GraphQL Yoga v{LATEST_VERSION}
      </Link>
    </Callout>
  );
}

export default {
  '*': {
    theme: {
      bottomContent: function BottomContent() {
        const { resolvedTheme } = useTheme();
        const { route } = useRouter();
        return (
          <Giscus
            // ensure giscus is reloaded when client side route is changed
            key={route}
            repo="dotansimha/graphql-yoga"
            repoId="MDEwOlJlcG9zaXRvcnkxMTA4MTk5Mzk="
            category="Docs Discussion"
            categoryId="DIC_kwDOBpr6Y84CAquY"
            mapping="pathname"
            theme={resolvedTheme}
          />
        );
      },
    },
  },
  index: {
    title: 'Home',
    type: 'page',
    display: 'hidden',
    theme: {
      layout: 'raw',
    },
  },
  docs: {
    title: 'v5 (latest)',
    type: 'page',
  },
  v4: {
    title: 'v4',
    type: 'page',
    theme: {
      topContent: LegacyDocsBanner,
    },
  },
  v3: {
    title: 'v3',
    type: 'page',
    theme: {
      topContent: LegacyDocsBanner,
    },
  },
  v2: {
    title: 'v2',
    type: 'page',
    theme: {
      topContent: LegacyDocsBanner,
    },
  },
  tutorial: {
    title: 'Tutorial',
    type: 'page',
  },
  changelog: {
    type: 'page',
    theme: {
      // Don't need comments in the changelog page
      bottomContent: null,
    },
  },
};
