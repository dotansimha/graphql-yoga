import { Module } from '@nestjs/common'
import { UsersResolvers } from './users.resolvers'
import { UsersService } from './users.service'

@Module({
  providers: [UsersResolvers, UsersService],
})
export class UsersModule {}
