import { FC, ReactNode } from 'react';
import { GitHubIcon, PaperIcon, PencilIcon, PRODUCTS } from '@theguild/components';
import { getDefaultMetadata, getPageMap, GuildLayout } from '@theguild/components/server';
import '@theguild/components/style.css';
import { pageMap as v2PageMap } from './v2/[[...slug]]/page';
import { pageMap as v3PageMap } from './v3/[[...slug]]/page';
import { pageMap as v4PageMap } from './v4/[[...slug]]/page';

const description = PRODUCTS.YOGA.title;
const websiteName = 'Yoga';

export const metadata = getDefaultMetadata({
  description,
  websiteName,
  productName: 'YOGA',
});

const RootLayout: FC<{
  children: ReactNode;
}> = async ({ children }) => {
  let [meta, ...pageMap] = await getPageMap();
  pageMap = [
    {
      data: {
        // @ts-expect-error
        ...meta.data,
        v2: { title: 'Yoga v2 Docs', type: 'page' },
        v3: { title: 'Yoga v3 Docs', type: 'page' },
        v4: { title: 'Yoga v4 Docs', type: 'page' },
      },
    },
    ...pageMap,
    { route: '/v2', name: 'v2', children: v2PageMap },
    { route: '/v3', name: 'v3', children: v3PageMap },
    { route: '/v4', name: 'v4', children: v4PageMap },
  ];
  return (
    <GuildLayout
      websiteName={websiteName}
      description={description}
      logo={<PRODUCTS.YOGA.logo className="w-8" />}
      layoutProps={{
        docsRepositoryBase: 'https://github.com/dotansimha/graphql-yoga/tree/main/website',
      }}
      pageMap={pageMap}
      navbarProps={{
        navLinks: [{ href: '/tutorial', children: 'Tutorial' }],
        developerMenu: [
          {
            href: '/docs',
            icon: <PaperIcon />,
            children: 'Documentation',
          },
          { href: 'https://the-guild.dev/blog', icon: <PencilIcon />, children: 'Blog' },
          {
            href: 'https://github.com/dotansimha/graphql-yoga',
            icon: <GitHubIcon />,
            children: 'GitHub',
          },
          {
            href: '/changelog',
            icon: null,
            children: 'Changelog'
          }
        ],
      }}
    >
      {children}
    </GuildLayout>
  );
};

export default RootLayout;
