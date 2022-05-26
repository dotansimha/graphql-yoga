import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { YogaGatewayDriverConfig, YogaGatewayDriver } from '../../../lib'
import { ConfigModule } from './config/config.module'
import { ConfigService } from './config/config.service'

@Module({
  imports: [
    GraphQLModule.forRootAsync<YogaGatewayDriverConfig>({
      driver: YogaGatewayDriver,
      useExisting: ConfigService,
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
