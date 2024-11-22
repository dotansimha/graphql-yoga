/* This file was automatically generated. DO NOT UPDATE MANUALLY. */
import { Comment } from './base/resolvers/Comment';
import { Link } from './base/resolvers/Link';
import { postCommentOnLink as Mutation_postCommentOnLink } from './base/resolvers/Mutation/postCommentOnLink';
import { postLink as Mutation_postLink } from './base/resolvers/Mutation/postLink';
import { comment as Query_comment } from './base/resolvers/Query/comment';
import { feed as Query_feed } from './base/resolvers/Query/feed';
import { info as Query_info } from './base/resolvers/Query/info';
import { link as Query_link } from './base/resolvers/Query/link';
import type { Resolvers } from './types.generated';

export const resolvers: Resolvers = {
  Query: { comment: Query_comment, feed: Query_feed, info: Query_info, link: Query_link },
  Mutation: { postCommentOnLink: Mutation_postCommentOnLink, postLink: Mutation_postLink },

  Comment: Comment,
  Link: Link,
};
