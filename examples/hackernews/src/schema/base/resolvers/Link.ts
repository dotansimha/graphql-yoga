import type { LinkResolvers } from '../../types.generated';

export const Link: LinkResolvers = {
  comments: async (parent, _arg, context) => {
    return context.prisma.comment.findMany({
      where: {
        linkId: parent.id,
      },
    });
  },
  description: async (_parent, _arg, _ctx) => {
    /* Link.description resolver is required because Link.description exists but LinkMapper.description does not */
  },
  id: async (_parent, _arg, _ctx) => {
    /* Link.id resolver is required because Link.id exists but LinkMapper.id does not */
  },
  url: async (_parent, _arg, _ctx) => {
    /* Link.url resolver is required because Link.url exists but LinkMapper.url does not */
  },
};
