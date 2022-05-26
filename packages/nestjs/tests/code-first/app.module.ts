import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { YogaDriverConfig } from '../../lib'
import { YogaDriver } from '../../lib/drivers'
import { DirectionsModule } from './directions/directions.module'
import { RecipesModule } from './recipes/recipes.module'

@Module({
  imports: [
    RecipesModule,
    DirectionsModule,
    GraphQLModule.forRoot<YogaDriverConfig>({
      driver: YogaDriver,
      // installSubscriptionHandlers: true,
      autoSchemaFile: true,
    }),
  ],
})
export class ApplicationModule {}
