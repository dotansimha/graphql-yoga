import { Module } from '@nestjs/common'
import { PostsResolvers } from './posts.resolvers'
import { UsersResolvers } from './users.resolvers'
import { PostsService } from './posts.service'
import { DateScalar } from './date.scalar'

@Module({
  providers: [PostsResolvers, PostsService, UsersResolvers, DateScalar],
})
export class PostsModule {}
