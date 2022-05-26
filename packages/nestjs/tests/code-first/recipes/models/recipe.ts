import {
  Field,
  ID,
  InterfaceType,
  MiddlewareContext,
  NextFn,
  ObjectType,
} from '@nestjs/graphql'
import { METADATA_FACTORY_NAME } from '@nestjs/graphql/plugin/plugin-constants'
@InterfaceType()
export abstract class Base {
  @Field((type) => ID)
  id: string
}

@InterfaceType({
  description: 'example interface',
  resolveType: (value) => {
    return Recipe
  },
})
export abstract class IRecipe extends Base {
  @Field()
  title: string
}

@ObjectType({ implements: IRecipe, description: 'recipe object type' })
export class Recipe extends IRecipe {
  @Field({
    nullable: true,
    middleware: [
      async (ctx: MiddlewareContext, next: NextFn) => {
        const value = await next()
        return value ? 'Description: ' + value : 'Placeholder'
      },
    ],
  })
  description?: string

  @Field()
  creationDate: Date

  @Field()
  get averageRating(): number {
    return 0.5
  }

  constructor(recipe: Partial<Recipe>) {
    super()
    Object.assign(this, recipe)
  }

  static [METADATA_FACTORY_NAME]() {
    return {
      lastRate: {
        nullable: true,
        type: () => Number,
        description: 'last rate description',
      },
      tags: { nullable: false, type: () => [String] },
    }
  }
}
