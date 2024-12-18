/* eslint sort-keys: error */
import { useRouter } from 'next/router';

// eslint-disable-next-line import/no-default-export
export default {
  chat: {
    link: 'https://discord.gg/94CDTmgmbs',
  },
  // color: {
  //   hue: 293,
  //   saturation: 69,
  // },
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
};
