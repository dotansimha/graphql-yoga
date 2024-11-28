import type { LinkResolvers } from '../../types.generated';

export const Link: LinkResolvers = {
  comments: async (parent, _arg, context) => {
    return context.prisma.comment.findMany({
      where: {
        linkId: parent.id,
      },
    });
  },
};
