export default {
  index: {
    title: 'Home',
    type: 'page',
    display: 'hidden',
    theme: {
      layout: 'raw',
    },
  },
  docs: {
    title: 'Docs',
    type: 'page',
  },
  v3: {
    type: 'page',
    display: 'hidden',
  },
  v2: {
    type: 'page',
    display: 'hidden',
  },
  'legacy-docs': {
    type: 'menu',
    title: 'Legacy Docs',
    items: {
      v3: { title: 'v3', href: '/v3' },
      v2: { title: 'v2', href: '/v2' },
    },
  },
  tutorial: {
    title: 'Tutorial',
    type: 'page',
  },
  changelog: {
    type: 'page',
  },
};
