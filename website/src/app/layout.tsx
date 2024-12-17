import { ComponentPropsWithoutRef, FC, ReactNode } from 'react';
import { Banner, GitHubIcon, PaperIcon, PencilIcon, PRODUCTS } from '@theguild/components';
import { getDefaultMetadata, GuildLayout } from '@theguild/components/server';
import '@theguild/components/style.css';

const description = PRODUCTS.ESLINT.title;
const websiteName = 'GraphQL-ESLint';

export const metadata = getDefaultMetadata({
  description,
  websiteName,
  productName: 'ESLINT',
});

const Anchor: FC<ComponentPropsWithoutRef<'a'>> = ({ children, ...props }) => {
  return (
    <a
      target="_blank"
      rel="noreferrer"
      className="_text-primary-600 _underline _decoration-from-font [text-underline-position:from-font]"
      {...props}
    >
      {children}
    </a>
  );
};

const RootLayout: FC<{
  children: ReactNode;
}> = async ({ children }) => {
  return (
    <GuildLayout
      websiteName={websiteName}
      description={description}
      logo={<PRODUCTS.ESLINT.logo className="text-lg" />}
      layoutProps={{
        banner: (
          <Banner dismissible={false}>
            This is documentation for v4 of the plugin. For v3 click{' '}
            <Anchor href="https://074c6ee9.graphql-eslint.pages.dev/docs">here</Anchor>.
          </Banner>
        ),
        docsRepositoryBase: 'https://github.com/dimaMachina/graphql-eslint/tree/master/website',
      }}
      navbarProps={{
        navLinks: [
          { children: 'Rules', href: '/rules' },
          { children: 'Playground', href: '/play' },
        ],
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
