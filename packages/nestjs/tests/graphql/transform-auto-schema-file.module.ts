import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { GraphQLSchema, lexicographicSortSchema } from 'graphql'
import { YogaDriverConfig } from '../../lib'
import { YogaDriver } from '../../lib/drivers'
import { DirectionsModule } from '../code-first/directions/directions.module'
import { RecipesModule } from '../code-first/recipes/recipes.module'

@Module({
  imports: [
    RecipesModule,
    DirectionsModule,
    GraphQLModule.forRoot<YogaDriverConfig>({
      driver: YogaDriver,
      autoSchemaFile: 'schema.graphql',
      transformSchema: (schema: GraphQLSchema) =>
        lexicographicSortSchema(schema),
      transformAutoSchemaFile: true,
    }),
  ],
})
export class TransformAutoSchemaFileModule {}
