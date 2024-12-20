/* eslint sort-keys: error */
import { useRouter } from 'next/router';
import { defineConfig, PRODUCTS } from '@theguild/components';

const docsRepositoryBase = 'https://github.com/dotansimha/graphql-yoga/tree/main/website';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  chat: {
    link: 'https://discord.gg/94CDTmgmbs',
  },
  // color: {
  //   hue: 293,
  //   saturation: 69,
  // },
  description: 'A fully-featured JS/TS GraphQL server',
  docsRepositoryBase,
  editLink: {
    component({ children, className, filePath }) {
      const { asPath } = useRouter();
      const isEditablePage = asPath.startsWith('/docs') || asPath.startsWith('/tutorial');

      return (
        isEditablePage && (
          <a
            className={className}
            target="_blank"
            rel="noreferrer"
            href={`${docsRepositoryBase}/${filePath}`}
          >
            {children}
          </a>
        )
      );
    },
  },
  // @ts-expect-error - TODO: fix types
  logo: PRODUCTS.YOGA.logo({ className: 'w-8' }),
  websiteName: 'Yoga',
});
