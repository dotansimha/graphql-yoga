import { ComponentPropsWithoutRef, FC, ReactNode } from 'react';
import { Banner, GitHubIcon, PaperIcon, PencilIcon, PRODUCTS } from '@theguild/components';
import { getDefaultMetadata, GuildLayout } from '@theguild/components/server';
import '@theguild/components/style.css';

const description = PRODUCTS.YOGA.title;
const websiteName = 'Yoga';

export const metadata = getDefaultMetadata({
  description,
  websiteName,
  productName: 'YOGA',
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
      logo={<PRODUCTS.YOGA.logo className="w-8" />}
      layoutProps={{
        docsRepositoryBase: 'https://github.com/dotansimha/graphql-yoga/tree/main/website',
      }}
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
