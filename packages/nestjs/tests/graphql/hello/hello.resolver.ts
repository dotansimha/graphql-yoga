import { UseGuards, UseInterceptors } from '@nestjs/common'
import { Query, Resolver } from '@nestjs/graphql'
import { Guard } from './guards/request-scoped.guard'
import { HelloService } from './hello.service'
import { Interceptor } from './interceptors/logging.interceptor'
import { UsersService } from './users/users.service'

@Resolver()
export class HelloResolver {
  static COUNTER = 0
  constructor(
    private readonly helloService: HelloService,
    private readonly usersService: UsersService,
  ) {
    HelloResolver.COUNTER++
  }

  @Query()
  @UseGuards(Guard)
  @UseInterceptors(Interceptor)
  getCats(): any[] {
    return this.helloService.getCats()
  }
}
