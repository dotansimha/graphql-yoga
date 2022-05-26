import { Module } from '@nestjs/common'
import { GqlOptionsFactory, GraphQLModule } from '@nestjs/graphql'
import { join } from 'path'
import { YogaDriver, YogaDriverConfig } from '../../lib'
import { CatsModule } from './cats/cats.module'

class ConfigService implements GqlOptionsFactory {
  createGqlOptions(): YogaDriverConfig {
    return {
      typePaths: [join(__dirname, '**', '*.graphql')],
      useGlobalPrefix: true,
    }
  }
}

@Module({
  imports: [
    CatsModule,
    GraphQLModule.forRootAsync<YogaDriverConfig>({
      driver: YogaDriver,
      useClass: ConfigService,
    }),
  ],
})
export class GlobalPrefixAsyncOptionsClassModule {}
