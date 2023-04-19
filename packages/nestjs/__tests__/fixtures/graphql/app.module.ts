import { join } from 'path'
import { Module } from '@nestjs/common'
import { DynamicModule } from '@nestjs/common/interfaces'
import { GraphQLModule } from '@nestjs/graphql'
import { YogaDriver, YogaDriverConfig } from '../../../src'
import { CatsModule } from './cats/cats.module'

@Module({})
export class AppModule {
  static forRoot(options?: YogaDriverConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [
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
