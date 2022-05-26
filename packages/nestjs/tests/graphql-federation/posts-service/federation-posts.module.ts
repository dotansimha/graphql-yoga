import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { join } from 'path'
import { YogaDriverConfig } from '../../../lib'
import { YogaFederationDriver } from '../../../lib/drivers'
import { PostsModule } from './posts/posts.module'
import { upperDirectiveTransformer } from './posts/upper.directive'

@Module({
  imports: [
    GraphQLModule.forRoot<YogaDriverConfig>({
      driver: YogaFederationDriver,
      typePaths: [join(__dirname, '**/*.graphql')],
      logging: true,
      transformSchema: (schema) => upperDirectiveTransformer(schema, 'upper'),
    }),
    PostsModule,
  ],
})
export class AppModule {}
