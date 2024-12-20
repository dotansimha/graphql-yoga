export default {
  // '*': {
  //   theme: {
  //     bottomContent: function BottomContent() {
  //       const { resolvedTheme } = useTheme();
  //       const { route } = useRouter();
  //       return (
  //         <Giscus
  //           // ensure giscus is reloaded when client side route is changed
  //           key={route}
  //           repo="dotansimha/graphql-yoga"
  //           repoId="MDEwOlJlcG9zaXRvcnkxMTA4MTk5Mzk="
  //           category="Docs Discussion"
  //           categoryId="DIC_kwDOBpr6Y84CAquY"
  //           mapping="pathname"
  //           theme={resolvedTheme}
  //         />
  //       );
  //     },
  //   },
  // },
  index: {
    type: 'page',
    display: 'hidden',
  },
  docs: {
    title: 'Documentation',
    type: 'page',
  },
  tutorial: {
    title: 'Tutorial',
    type: 'page',
  },
};
