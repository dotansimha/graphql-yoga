import { join } from 'node:path'
import { Module, DynamicModule } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { YogaDriver, YogaDriverConfig } from '../../../src'
import { CatsModule } from './cats/cats.module'
import { HttpAdapterHost } from '@nestjs/core'

@Module({})
export class AppModule {
  static forRoot(options?: YogaDriverConfig): DynamicModule {
    return {
      module: AppModule,
      providers: [HttpAdapterHost],
      imports: [
        HttpAdapterHost,
        CatsModule,
        GraphQLModule.forRoot<YogaDriverConfig>({
          ...options,
          driver: YogaDriver,
          typePaths: [join(__dirname, '**', '*.graphql')],
        }),
      ],
    }
  }
}
