import type { LinkResolvers } from '../../types.generated';

export const Link: LinkResolvers = {
  comments: async (parent, _arg, context) => {
    const comments = context.prisma.comment.findMany({
      where: {
        linkId: parent.id,
      },
    });
    if (comments.length === 0) {
      return null;
    }
    return comments;
  },
};
