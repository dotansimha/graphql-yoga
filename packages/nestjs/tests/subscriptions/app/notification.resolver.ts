import { Logger, UseGuards } from '@nestjs/common'
import { Args, Query, Resolver, Subscription } from '@nestjs/graphql'
import { PubSub } from 'graphql-subscriptions'
import { AuthGuard } from './auth.guard'
import { Notification } from './notification'

export const pubSub = new PubSub()

@Resolver(() => Notification)
export class NotificationResolver {
  private readonly logger = new Logger(NotificationResolver.name)

  @Query(() => Notification)
  getNotification() {
    return {
      message: 'Hello!',
    }
  }

  @UseGuards(AuthGuard)
  @Subscription(() => Notification, {
    filter(payload, variables, context) {
      return (
        context.user === payload.newNotification.recipient &&
        payload.newNotification.id === variables.id
      )
    },
  })
  newNotification(
    @Args('id', {
      nullable: false,
    })
    id: string,
  ) {
    this.logger.log('User subscribed to newNotification')
    return pubSub.asyncIterator('newNotification')
  }
}
