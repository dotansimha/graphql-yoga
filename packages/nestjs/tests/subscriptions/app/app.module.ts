import { Module } from '@nestjs/common'
import { DynamicModule } from '@nestjs/common/interfaces'
import { GraphQLModule } from '@nestjs/graphql'
import { GqlModuleOptions } from '@nestjs/graphql'
import { YogaDriver, YogaDriverConfig } from '../../../lib'
import { NotificationModule } from './notification.module'

export type AppModuleConfig = {
  context?: GqlModuleOptions['context']
  subscriptions?: YogaDriverConfig['subscriptions']
}

@Module({})
export class AppModule {
  static forRoot(options?: AppModuleConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [
        NotificationModule,
        GraphQLModule.forRoot<YogaDriverConfig>({
          driver: YogaDriver,
          context: options?.context,
          autoSchemaFile: true,
          subscriptions: options?.subscriptions,
        }),
      ],
    }
  }
}
