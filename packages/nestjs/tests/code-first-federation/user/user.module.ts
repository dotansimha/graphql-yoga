import { Module } from '@nestjs/common'
import { UserResolver } from './user.resolver'
import { PostModule } from '../post/post.module'

@Module({
  providers: [UserResolver],
  imports: [PostModule],
})
export class UserModule {}
