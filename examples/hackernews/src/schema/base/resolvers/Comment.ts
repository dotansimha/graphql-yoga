import type { CommentResolvers } from '../../types.generated';

export const Comment: CommentResolvers = {
  link(parent, _arg, context) {
    return context.prisma.link.findUniqueOrThrow({
      where: {
        id: parent.linkId,
      },
    });
  },
};
