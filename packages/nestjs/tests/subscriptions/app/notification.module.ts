import { Module } from '@nestjs/common'
import { NotificationResolver } from './notification.resolver'

@Module({
  providers: [NotificationResolver],
})
export class NotificationModule {}
