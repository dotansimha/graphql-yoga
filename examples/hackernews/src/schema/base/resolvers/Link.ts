import type { LinkResolvers } from '../../types.generated';

export const Link: LinkResolvers = {
  comments: async (parent, _arg, context) => {
    const comments = await context.prisma.comment.findMany({
      orderBy: { createdAt: 'desc' },
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
