import { FC, ReactNode } from 'react';
import { GitHubIcon, PaperIcon, PencilIcon, PRODUCTS } from '@theguild/components';
import { getDefaultMetadata, getPageMap, GuildLayout } from '@theguild/components/server';
import '@theguild/components/style.css';
import { pageMap as v2PageMap } from './v2/[[...slug]]/page';

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
        v2: {
          title: 'Documentation v2',
          type: 'page',
        },
      },
    },
    ...pageMap,
    {
      route: '/v2',
      name: 'v2',
      children: v2PageMap,
    },
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
        navLinks: [],
        developerMenu: [
          {
            href: '/docs',
            icon: <PaperIcon />,
            children: 'Documentation',
          },
          { href: 'https://the-guild.dev/blog', icon: <PencilIcon />, children: 'Blog' },
          {
            href: 'https://github.com/dimaMachina/graphql-eslint',
            icon: <GitHubIcon />,
            children: 'GitHub',
          },
        ],
      }}
    >
      {children}
    </GuildLayout>
  );
};

export default RootLayout;
