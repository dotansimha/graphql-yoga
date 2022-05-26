import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { YogaDriver, YogaDriverConfig } from '../../lib'
import { CatsModule } from './cats/cats.module'
import { ConfigModule } from './config.module'
import { ConfigService } from './config.service'

@Module({
  imports: [
    CatsModule,
    GraphQLModule.forRootAsync<YogaDriverConfig>({
      driver: YogaDriver,
      imports: [ConfigModule],
      useExisting: ConfigService,
    }),
  ],
})
export class AsyncExistingApplicationModule {}
