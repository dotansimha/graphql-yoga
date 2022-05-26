import { Parent, ResolveField, Resolver } from '@nestjs/graphql'
import { PostService } from '../post/post.service'
import { User } from './user.entity'

@Resolver((of) => User)
export class UserResolver {
  constructor(private readonly postService: PostService) {}

  @ResolveField()
  public posts(@Parent() user: User) {
    return this.postService.forAuthor(user.id)
  }
}
