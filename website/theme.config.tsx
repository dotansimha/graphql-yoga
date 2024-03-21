/* eslint sort-keys: error */
import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Callout, defineConfig, Giscus, PRODUCTS, useTheme } from '@theguild/components';

const docsRepositoryBase = 'https://github.com/dotansimha/graphql-yoga/tree/main/website';

export default defineConfig({
  chat: {
    link: 'https://discord.gg/94CDTmgmbs',
  },
  description: `A fully-featured JS/TS GraphQL server`,
  docsRepositoryBase,
  editLink: {
    component({ children, className, filePath }) {
      const { asPath } = useRouter();

      if (asPath.startsWith('/v2')) {
        return null;
      }
      return (
        <a
          className={className}
          target="_blank"
          rel="noreferrer"
          href={`${docsRepositoryBase}/${filePath}`}
        >
          {children}
        </a>
      );
    },
  },
  logo: PRODUCTS.YOGA.logo({ className: 'w-8' }),
  main({ children }) {
    const { resolvedTheme } = useTheme();
    const { route } = useRouter();

    const comments = route !== '/' && (
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

    return (
      <>
        {route.startsWith('/v2') && (
          <Callout type="warning">
            This is the documentation for the <b>old</b> GraphQL Yoga version 2. We recommend
            upgrading to the latest GraphQL Yoga version 5.
            <br />
            <br />
            <Link
              href="/docs/migration/migration-from-yoga-v2"
              className="nx-text-primary-600 nx-underline nx-decoration-from-font [text-underline-position:from-font]"
            >
              Migrate to GraphQL Yoga v5
            </Link>
          </Callout>
        )}
        {route.startsWith('/v3') && (
          <Callout type="warning">
            This is the documentation for the <b>old</b> GraphQL Yoga version 3. We recommend
            upgrading to the latest GraphQL Yoga version 5.
            <br />
            <br />
            <Link
              href="/docs/migration/migration-from-yoga-v3"
              className="nx-text-primary-600 nx-underline nx-decoration-from-font [text-underline-position:from-font]"
            >
              Migrate to GraphQL Yoga v5
            </Link>
          </Callout>
        )}
        {route.startsWith('/v4') && (
          <Callout type="warning">
            This is the documentation for the <b>old</b> GraphQL Yoga version 4. We recommend
            upgrading to the latest GraphQL Yoga version 5.
            <br />
            <br />
            <Link
              href="/docs/migration/migration-from-yoga-v4"
              className="nx-text-primary-600 nx-underline nx-decoration-from-font [text-underline-position:from-font]"
            >
              Migrate to GraphQL Yoga v5
            </Link>
          </Callout>
        )}
        {children}
        {comments}
      </>
    );
  },
  websiteName: 'Yoga',
});
