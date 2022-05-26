import { NotFoundException, UseGuards } from '@nestjs/common'
import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
  Subscription,
} from '@nestjs/graphql'
import { PubSub } from 'graphql-subscriptions'
import { AuthGuard } from '../common/guards/auth.guard'
import { FilterRecipesCountArgs } from './dto/filter-recipes-count.args'
import { NewRecipeInput } from './dto/new-recipe.input'
import { RecipesArgs } from './dto/recipes.args'
import { Category } from './models/category'
import { Ingredient } from './models/ingredient'
import { IRecipe, Recipe } from './models/recipe'
import { RecipesService } from './recipes.service'
import { SearchResultUnion } from './unions/search-result.union'

const pubSub = new PubSub()

@Resolver((of) => Recipe)
export class RecipesResolver {
  constructor(private readonly recipesService: RecipesService) {}

  @UseGuards(AuthGuard)
  @Query((returns) => IRecipe, { description: 'get recipe by id' })
  async recipe(
    @Args('id', {
      defaultValue: '1',
      description: 'recipe id',
    })
    id: string,
  ): Promise<IRecipe> {
    const recipe = await this.recipesService.findOneById(id)
    if (!recipe) {
      throw new NotFoundException(id)
    }
    return recipe
  }

  @Query((returns) => [SearchResultUnion], { deprecationReason: 'test' })
  async search(): Promise<Array<typeof SearchResultUnion>> {
    return [
      new Recipe({ title: 'recipe' }),
      new Ingredient({
        name: 'test',
      }),
    ]
  }

  @Query((returns) => [Category])
  categories() {
    return [new Category({ name: 'Category #1' })]
  }

  @Query((returns) => [Recipe])
  recipes(@Args() recipesArgs: RecipesArgs): Promise<Recipe[]> {
    return this.recipesService.findAll(recipesArgs)
  }

  @Mutation((returns) => Recipe)
  async addRecipe(
    @Args('newRecipeData') newRecipeData: NewRecipeInput,
  ): Promise<Recipe> {
    const recipe = await this.recipesService.create(newRecipeData)
    pubSub.publish('recipeAdded', { recipeAdded: recipe })
    return recipe
  }

  @ResolveField('ingredients', () => [Ingredient])
  getIngredients(@Parent() root) {
    return [new Ingredient({ name: 'cherry' })]
  }

  @ResolveField((type) => Number)
  count(@Args() filters: FilterRecipesCountArgs) {
    return 10
  }

  @ResolveField()
  rating(): number {
    return 10
  }

  @Mutation((returns) => Boolean)
  async removeRecipe(@Args('id') id: string) {
    return this.recipesService.remove(id)
  }

  @Subscription((returns) => Recipe, {
    description: 'subscription description',
  })
  recipeAdded() {
    return pubSub.asyncIterator('recipeAdded')
  }
}
