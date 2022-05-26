import { Args, Query, Resolver } from '@nestjs/graphql'
import { RecipesArgs } from '../recipes/dto/recipes.args'
import { Recipe } from '../recipes/models/recipe'

@Resolver(() => Recipe, { isAbstract: true })
export class AbstractResolver {
  @Query((returns) => [Recipe])
  abstractRecipes(@Args() recipesArgs: RecipesArgs): Recipe[] {
    return []
  }
}
