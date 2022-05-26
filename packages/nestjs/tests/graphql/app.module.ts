import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { join } from 'path'
import { YogaDriverConfig } from '../../lib'
import { YogaDriver } from '../../lib/drivers'
import { CatsModule } from './cats/cats.module'

@Module({
  imports: [
    CatsModule,
    GraphQLModule.forRoot<YogaDriverConfig>({
      driver: YogaDriver,
      typePaths: [join(__dirname, '**', '*.graphql')],
    }),
  ],
})
export class ApplicationModule {}
