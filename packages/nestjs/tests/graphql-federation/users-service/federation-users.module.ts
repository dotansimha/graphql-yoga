import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { join } from 'path'
import { YogaFederationDriver, YogaFederationDriverConfig } from '../../../lib'
import { UsersModule } from './users/users.module'

@Module({
  imports: [
    GraphQLModule.forRoot<YogaFederationDriverConfig>({
      driver: YogaFederationDriver,
      logging: true,
      typePaths: [join(__dirname, '**/*.graphql')],
    }),
    UsersModule,
  ],
})
export class AppModule {}
