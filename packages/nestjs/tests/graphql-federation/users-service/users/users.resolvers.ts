import { Args, Query, Resolver, ResolveReference } from '@nestjs/graphql'
import { UsersService } from './users.service'
@Resolver('User')
export class UsersResolvers {
  constructor(private readonly usersService: UsersService) {}

  @Query()
  getUser(@Args('id') id: string) {
    return this.usersService.findById(id)
  }

  @ResolveReference()
  resolveReference(reference: { __typename: string; id: string }) {
    return this.usersService.findById(reference.id)
  }
}
