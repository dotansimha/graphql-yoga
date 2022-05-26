import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { YogaFederationDriver } from '../../../lib/drivers'
import { ConfigModule } from './config/config.module'
import { ConfigService } from './config/config.service'
import { UsersModule } from './users/users.module'

@Module({
  imports: [
    GraphQLModule.forRootAsync({
      driver: YogaFederationDriver,
      useExisting: ConfigService,
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    UsersModule,
  ],
})
export class AppModule {}
