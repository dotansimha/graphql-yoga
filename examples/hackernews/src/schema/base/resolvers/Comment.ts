import type { CommentResolvers } from '../../types.generated';

export const Comment: CommentResolvers = {
  link(parent, _arg, context) {
    if (!parent.linkId) {
      return null;
    }

    return context.prisma.link.findUnique({
      where: {
        id: parent.linkId,
      },
    });
  },
};
