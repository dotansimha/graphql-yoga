import { createUnionType } from '@nestjs/graphql'
import { Post } from '../post/post.entity'
import { User } from '../user/user.entity'

export const FederationSearchResultUnion = createUnionType({
  name: 'FederationSearchResultUnion',
  description: 'Search result description',
  types: () => [Post, User],
  resolveType: (value) => {
    if ('posts' in value) {
      return User
    }
    if ('title' in value) {
      return Post
    }
    return undefined
  },
})
