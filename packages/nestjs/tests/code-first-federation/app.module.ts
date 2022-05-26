import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { YogaFederationDriver, YogaFederationDriverConfig } from '../../lib'
import { PostModule } from './post/post.module'
import { RecipeModule } from './recipe/recipe.module'
import { User } from './user/user.entity'
import { UserModule } from './user/user.module'

@Module({
  imports: [
    UserModule,
    PostModule,
    RecipeModule,
    GraphQLModule.forRoot<YogaFederationDriverConfig>({
      driver: YogaFederationDriver,
      autoSchemaFile: true,
      buildSchemaOptions: {
        orphanedTypes: [User],
      },
    }),
  ],
})
export class ApplicationModule {}
