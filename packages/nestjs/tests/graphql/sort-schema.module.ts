import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { join } from 'path'
import { YogaDriver, YogaDriverConfig } from '../../lib'
import { CatsModule } from './cats/cats.module'

@Module({
  imports: [
    CatsModule,
    GraphQLModule.forRoot<YogaDriverConfig>({
      driver: YogaDriver,
      typePaths: [join(__dirname, '**', '*.graphql')],
      sortSchema: true,
    }),
  ],
})
export class SortSchemaModule {}
