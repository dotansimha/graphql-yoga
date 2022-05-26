import { DynamicModule, Inject, Module, Provider, Scope } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { join } from 'path'
import { YogaDriverConfig } from '../../../lib'
import { YogaDriver } from '../../../lib/drivers'
import { HelloResolver } from './hello.resolver'
import { HelloService } from './hello.service'
import { UsersService } from './users/users.service'

@Module({
  imports: [
    GraphQLModule.forRoot<YogaDriverConfig>({
      driver: YogaDriver,
      typePaths: [join(__dirname, '*.graphql')],
    }),
  ],
  providers: [
    HelloResolver,
    HelloService,
    UsersService,
    {
      provide: 'REQUEST_ID',
      useFactory: () => 1,
      scope: Scope.REQUEST,
    },
  ],
})
export class HelloModule {
  constructor(@Inject('META') private readonly meta) {}

  static forRoot(meta: Provider): DynamicModule {
    return {
      module: HelloModule,
      providers: [meta],
    }
  }
}
