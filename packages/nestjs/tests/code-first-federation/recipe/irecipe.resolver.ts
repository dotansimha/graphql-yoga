import { Query, Resolver } from '@nestjs/graphql'
import { IRecipe } from './recipe'

@Resolver((of) => IRecipe)
export class IRecipeResolver {
  @Query((returns) => IRecipe)
  public recipe() {
    return { id: '1', title: 'Recipe', description: 'Interface description' }
  }
}
