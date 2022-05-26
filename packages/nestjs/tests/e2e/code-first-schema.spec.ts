import {
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
} from '@nestjs/graphql'
import { GRAPHQL_SDL_FILE_HEADER } from '@nestjs/graphql'
import { Test } from '@nestjs/testing'
import {
  getIntrospectionQuery,
  graphql,
  GraphQLSchema,
  IntrospectionField,
  IntrospectionSchema,
  printSchema,
  TypeKind,
} from 'graphql'
import { DirectionsResolver } from '../code-first/directions/directions.resolver'
import { SampleOrphanedEnum } from '../code-first/enums/sample-orphaned.enum'
import { AbstractResolver } from '../code-first/other/abstract.resolver'
import { SampleOrphanedType } from '../code-first/other/sample-orphaned.type'
import { IRecipesResolver } from '../code-first/recipes/irecipes.resolver'
import { Recipe } from '../code-first/recipes/models/recipe'
import { RecipesResolver } from '../code-first/recipes/recipes.resolver'
import {
  getMutation,
  getMutationByName,
  getQuery,
  getQueryByName,
  getSubscription,
  getSubscriptionByName,
} from '../utils/introspection-schema.utils'
import { printedSchemaSnapshot } from '../utils/printed-schema.snapshot'

describe('Code-first - schema factory', () => {
  let schemaFactory: GraphQLSchemaFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile()

    schemaFactory = moduleRef.get(GraphQLSchemaFactory)
  })

  describe('generated schema', () => {
    let schema: GraphQLSchema
    let introspectionSchema: IntrospectionSchema

    beforeAll(async () => {
      schema = await schemaFactory.create(
        [
          RecipesResolver,
          DirectionsResolver,
          AbstractResolver,
          IRecipesResolver,
        ],
        { orphanedTypes: [SampleOrphanedType, SampleOrphanedEnum] },
      )

      introspectionSchema = await (
        await graphql(schema, getIntrospectionQuery())
      ).data.__schema
    })
    it('should be valid', async () => {
      expect(schema).toBeInstanceOf(GraphQLSchema)
    })
    it('should match schema snapshot', () => {
      expect(GRAPHQL_SDL_FILE_HEADER + printSchema(schema)).toEqual(
        printedSchemaSnapshot,
      )
    })
    it('should define 5 queries', async () => {
      const type = getQuery(introspectionSchema)

      expect(type.fields.length).toEqual(5)
      expect(type.fields.map((item) => item.name)).toEqual(
        expect.arrayContaining([
          'recipes',
          'search',
          'categories',
          'move',
          'recipe',
        ]),
      )
    })

    it('should define "addRecipe" and "removeRecipe", mutations', async () => {
      const type = getMutation(introspectionSchema)

      expect(type.fields.length).toEqual(2)
      expect(type.fields.map((item) => item.name)).toEqual(
        expect.arrayContaining(['addRecipe', 'removeRecipe']),
      )
    })

    it('should define "recipeAdded" subscription', async () => {
      const type = getSubscription(introspectionSchema)

      expect(type.fields.length).toEqual(1)
      expect(type.fields.map((item) => item.name)).toEqual(
        expect.arrayContaining(['recipeAdded']),
      )
    })

    it('should not define an abstract resolver', () => {
      const abstractQuery = getQueryByName(
        introspectionSchema,
        'abstractRecipes',
      )
      expect(abstractQuery).toBeUndefined()
    })

    it('should define "Direction" enum', () => {
      const type = introspectionSchema.types.find(
        ({ name }) => name === 'Direction',
      )
      expect(type).toEqual(
        expect.objectContaining({
          kind: TypeKind.ENUM,
          name: 'Direction',
          description: 'The basic directions',
          enumValues: [
            {
              deprecationReason: null,
              description: 'The primary direction',
              isDeprecated: false,
              name: 'Up',
            },
            {
              deprecationReason: null,
              description: null,
              isDeprecated: false,
              name: 'Down',
            },
            {
              deprecationReason: null,
              description: null,
              isDeprecated: false,
              name: 'Left',
            },
            {
              deprecationReason: null,
              description: null,
              isDeprecated: false,
              name: 'Right',
            },
            {
              deprecationReason: 'Replaced with Left or Right',
              description: null,
              isDeprecated: true,
              name: 'Sideways',
            },
          ],
        }),
      )
    })

    it('should define "SearchResultUnion" union', () => {
      const type = introspectionSchema.types.find(
        ({ name }) => name === 'SearchResultUnion',
      )
      expect(type).toEqual(
        expect.objectContaining({
          description: 'Search result description',
          kind: TypeKind.UNION,
          name: 'SearchResultUnion',
          possibleTypes: [
            {
              kind: TypeKind.OBJECT,
              name: 'Ingredient',
              ofType: null,
            },
            {
              kind: TypeKind.OBJECT,
              name: 'Recipe',
              ofType: null,
            },
          ],
        }),
      )
    })

    it('should define "Ingredient" type', () => {
      const type = introspectionSchema.types.find(
        ({ name }) => name === 'Ingredient',
      )
      expect(type).toEqual(
        expect.objectContaining({
          name: 'Ingredient',
          kind: TypeKind.OBJECT,
          fields: expect.arrayContaining([
            {
              args: [],
              deprecationReason: null,
              description: null,
              isDeprecated: false,
              name: 'id',
              type: {
                kind: TypeKind.NON_NULL,
                name: null,
                ofType: { kind: TypeKind.SCALAR, name: 'ID', ofType: null },
              },
            },
            {
              args: [],
              deprecationReason: 'is deprecated',
              description: 'ingredient name',
              isDeprecated: true,
              name: 'name',
              type: {
                kind: TypeKind.SCALAR,
                name: 'String',
                ofType: null,
              },
            },
          ]),
        }),
      )
    })

    it('should define "Recipe" type', () => {
      const type = introspectionSchema.types.find(
        ({ name }) => name === 'Recipe',
      )
      expect(type).toEqual(
        expect.objectContaining({
          name: Recipe.name,
          kind: TypeKind.OBJECT,
          description: 'recipe object type',
          interfaces: [
            { kind: TypeKind.INTERFACE, name: 'IRecipe', ofType: null },
          ],
          fields: [
            {
              args: [],
              deprecationReason: null,
              description: null,
              isDeprecated: false,
              name: 'id',
              type: {
                kind: TypeKind.NON_NULL,
                name: null,
                ofType: { kind: TypeKind.SCALAR, name: 'ID', ofType: null },
              },
            },
            {
              args: [],
              deprecationReason: null,
              description: null,
              isDeprecated: false,
              name: 'title',
              type: {
                kind: TypeKind.NON_NULL,
                name: null,
                ofType: { kind: TypeKind.SCALAR, name: 'String', ofType: null },
              },
            },
            {
              args: [
                {
                  defaultValue: null,
                  description: null,
                  name: 'arg',
                  type: { kind: 'SCALAR', name: 'Float', ofType: null },
                },
              ],
              deprecationReason: null,
              description: null,
              isDeprecated: false,
              name: 'interfaceResolver',
              type: {
                kind: TypeKind.NON_NULL,
                name: null,
                ofType: {
                  kind: TypeKind.SCALAR,
                  name: 'Boolean',
                  ofType: null,
                },
              },
            },
            {
              args: [],
              deprecationReason: null,
              description: null,
              isDeprecated: false,
              name: 'description',
              type: { kind: TypeKind.SCALAR, name: 'String', ofType: null },
            },
            {
              args: [],
              deprecationReason: null,
              description: null,
              isDeprecated: false,
              name: 'creationDate',
              type: {
                kind: TypeKind.NON_NULL,
                name: null,
                ofType: {
                  kind: TypeKind.SCALAR,
                  name: 'DateTime',
                  ofType: null,
                },
              },
            },
            {
              args: [],
              deprecationReason: null,
              description: null,
              isDeprecated: false,
              name: 'averageRating',
              type: {
                kind: TypeKind.NON_NULL,
                name: null,
                ofType: { kind: TypeKind.SCALAR, name: 'Float', ofType: null },
              },
            },
            {
              args: [],
              deprecationReason: null,
              description: 'last rate description',
              isDeprecated: false,
              name: 'lastRate',
              type: { kind: TypeKind.SCALAR, name: 'Float', ofType: null },
            },
            {
              args: [],
              deprecationReason: null,
              description: null,
              isDeprecated: false,
              name: 'tags',
              type: {
                kind: TypeKind.NON_NULL,
                name: null,
                ofType: {
                  kind: TypeKind.LIST,
                  name: null,
                  ofType: {
                    kind: TypeKind.NON_NULL,
                    name: null,
                    ofType: {
                      kind: TypeKind.SCALAR,
                      name: 'String',
                      ofType: null,
                    },
                  },
                },
              },
            },
            {
              args: [],
              deprecationReason: null,
              description: null,
              isDeprecated: false,
              name: 'ingredients',
              type: {
                kind: TypeKind.NON_NULL,
                name: null,
                ofType: {
                  kind: 'LIST',
                  name: null,
                  ofType: {
                    kind: TypeKind.NON_NULL,
                    name: null,
                    ofType: {
                      kind: 'OBJECT',
                      name: 'Ingredient',
                      ofType: null,
                    },
                  },
                },
              },
            },
            {
              args: [
                {
                  defaultValue: null,
                  description: null,
                  name: 'type',
                  type: { kind: TypeKind.SCALAR, name: 'String', ofType: null },
                },
                {
                  defaultValue: null,
                  description: null,
                  name: 'status',
                  type: { kind: TypeKind.SCALAR, name: 'String', ofType: null },
                },
              ],
              deprecationReason: null,
              description: null,
              isDeprecated: false,
              name: 'count',
              type: {
                kind: TypeKind.NON_NULL,
                name: null,
                ofType: { kind: TypeKind.SCALAR, name: 'Float', ofType: null },
              },
            },
            {
              args: [],
              deprecationReason: null,
              description: null,
              isDeprecated: false,
              name: 'rating',
              type: {
                kind: TypeKind.NON_NULL,
                name: null,
                ofType: { kind: TypeKind.SCALAR, name: 'Float', ofType: null },
              },
            },
          ],
        }),
      )
    })

    it('should define "SampleOrphanedType" orphaned type', () => {
      const type = introspectionSchema.types.find(
        ({ name }) => name === 'SampleOrphanedType',
      )
      expect(type).toEqual(
        expect.objectContaining({
          description: 'orphaned type',
          enumValues: null,
          fields: [
            {
              args: [],
              deprecationReason: null,
              description: null,
              isDeprecated: false,
              name: 'id',
              type: {
                kind: TypeKind.NON_NULL,
                name: null,
                ofType: { kind: TypeKind.SCALAR, name: 'ID', ofType: null },
              },
            },
            {
              args: [],
              deprecationReason: null,
              description: null,
              isDeprecated: false,
              name: 'title',
              type: {
                kind: TypeKind.NON_NULL,
                name: null,
                ofType: { kind: TypeKind.SCALAR, name: 'String', ofType: null },
              },
            },
            {
              args: [],
              deprecationReason: null,
              description: null,
              isDeprecated: false,
              name: 'description',
              type: { kind: TypeKind.SCALAR, name: 'String', ofType: null },
            },
            {
              args: [],
              deprecationReason: null,
              description: null,
              isDeprecated: false,
              name: 'creationDate',
              type: {
                kind: TypeKind.NON_NULL,
                name: null,
                ofType: {
                  kind: TypeKind.SCALAR,
                  name: 'DateTime',
                  ofType: null,
                },
              },
            },
            {
              args: [],
              deprecationReason: null,
              description: null,
              isDeprecated: false,
              name: 'averageRating',
              type: {
                kind: TypeKind.NON_NULL,
                name: null,
                ofType: { kind: TypeKind.SCALAR, name: 'Float', ofType: null },
              },
            },
          ],
          inputFields: null,
          interfaces: [],
          kind: 'OBJECT',
          name: 'SampleOrphanedType',
          possibleTypes: null,
        }),
      )
    })

    it('should define "SampleOrphanedEnum" orphaned type', () => {
      const type = introspectionSchema.types.find(
        ({ name }) => name === 'SampleOrphanedEnum',
      )
      expect(type).toEqual(
        expect.objectContaining({
          kind: TypeKind.ENUM,
          name: 'SampleOrphanedEnum',
          description: 'orphaned enum',
          enumValues: [
            {
              deprecationReason: null,
              description: null,
              isDeprecated: false,
              name: 'Red',
            },
            {
              deprecationReason: null,
              description: null,
              isDeprecated: false,
              name: 'Blue',
            },
            {
              deprecationReason: null,
              description: null,
              isDeprecated: false,
              name: 'Black',
            },
            {
              deprecationReason: null,
              description: null,
              isDeprecated: false,
              name: 'White',
            },
          ],
        }),
      )
    })

    it('should define "IRecipe" interface', () => {
      const type = introspectionSchema.types.find(
        ({ name }) => name === 'IRecipe',
      )
      expect(type).toEqual(
        expect.objectContaining({
          name: 'IRecipe',
          kind: TypeKind.INTERFACE,
          description: 'example interface',
          possibleTypes: [
            { kind: TypeKind.OBJECT, name: 'Recipe', ofType: null },
          ],
          fields: [
            {
              args: [],
              deprecationReason: null,
              description: null,
              isDeprecated: false,
              name: 'id',
              type: {
                kind: TypeKind.NON_NULL,
                name: null,
                ofType: { kind: TypeKind.SCALAR, name: 'ID', ofType: null },
              },
            },
            {
              args: [],
              deprecationReason: null,
              description: null,
              isDeprecated: false,
              name: 'title',
              type: {
                kind: TypeKind.NON_NULL,
                name: null,
                ofType: { kind: TypeKind.SCALAR, name: 'String', ofType: null },
              },
            },
            {
              args: [
                {
                  defaultValue: null,
                  description: null,
                  name: 'arg',
                  type: { kind: 'SCALAR', name: 'Float', ofType: null },
                },
              ],
              deprecationReason: null,
              description: null,
              isDeprecated: false,
              name: 'interfaceResolver',
              type: {
                kind: TypeKind.NON_NULL,
                name: null,
                ofType: {
                  kind: TypeKind.SCALAR,
                  name: 'Boolean',
                  ofType: null,
                },
              },
            },
          ],
        }),
      )
    })

    it('should define "NewRecipeInput" input type', () => {
      const type = introspectionSchema.types.find(
        ({ name }) => name === 'NewRecipeInput',
      )
      expect(type).toEqual(
        expect.objectContaining({
          name: 'NewRecipeInput',
          kind: TypeKind.INPUT_OBJECT,
          description: 'new recipe input',
          inputFields: [
            {
              defaultValue: null,
              description: 'recipe title',
              name: 'title',
              type: {
                kind: TypeKind.NON_NULL,
                name: null,
                ofType: { kind: TypeKind.SCALAR, name: 'String', ofType: null },
              },
            },
            {
              defaultValue: null,
              description: null,
              name: 'description',
              type: { kind: TypeKind.SCALAR, name: 'String', ofType: null },
            },
            {
              defaultValue: null,
              description: null,
              name: 'ingredients',
              type: {
                kind: TypeKind.NON_NULL,
                name: null,
                ofType: {
                  kind: TypeKind.LIST,
                  name: null,
                  ofType: {
                    kind: TypeKind.NON_NULL,
                    name: null,
                    ofType: {
                      kind: TypeKind.SCALAR,
                      name: 'String',
                      ofType: null,
                    },
                  },
                },
              },
            },
          ],
        }),
      )
    })

    describe('Query: "recipe"', () => {
      let recipeQuery: IntrospectionField

      beforeAll(() => {
        recipeQuery = getQueryByName(introspectionSchema, 'recipe')
      })
      it('should define description', () => {
        expect(recipeQuery.description).toEqual('get recipe by id')
      })
      it('should set as not deprecated', () => {
        expect(recipeQuery.isDeprecated).toBeFalsy()
      })
      it('should return "IRecipe" interface', () => {
        expect(recipeQuery.type).toEqual({
          kind: TypeKind.NON_NULL,
          name: null,
          ofType: { kind: TypeKind.INTERFACE, name: 'IRecipe', ofType: null },
        })
      })
      it('should take "id" as an input argument', () => {
        expect(recipeQuery.args.length).toEqual(1)
        expect(recipeQuery.args).toEqual(
          expect.arrayContaining([
            {
              defaultValue: '"1"',
              description: 'recipe id',
              name: 'id',
              type: { kind: TypeKind.SCALAR, name: 'String', ofType: null },
            },
          ]),
        )
      })
    })
    describe('Query: "search"', () => {
      let searchQuery: IntrospectionField

      beforeAll(() => {
        searchQuery = getQueryByName(introspectionSchema, 'search')
      })
      it('should not set description', () => {
        expect(searchQuery.description).toEqual(null)
      })
      it('should set as deprecated', () => {
        expect(searchQuery.isDeprecated).toBeTruthy()
        expect(searchQuery.deprecationReason).toEqual('test')
      })
      it('should return "SearchResultUnion" union', () => {
        expect(searchQuery.type).toEqual({
          kind: TypeKind.NON_NULL,
          name: null,
          ofType: {
            kind: TypeKind.LIST,
            name: null,
            ofType: {
              kind: TypeKind.NON_NULL,
              name: null,
              ofType: {
                kind: TypeKind.UNION,
                name: 'SearchResultUnion',
                ofType: null,
              },
            },
          },
        })
      })
      it('should not take any input arguments', () => {
        expect(searchQuery.args.length).toEqual(0)
      })
    })
    describe('Query: "recipes"', () => {
      let recipesQuery: IntrospectionField

      beforeAll(() => {
        recipesQuery = getQueryByName(introspectionSchema, 'recipes')
      })
      it('should not set description', () => {
        expect(recipesQuery.description).toEqual(null)
      })
      it('should not set as deprecated', () => {
        expect(recipesQuery.isDeprecated).toBeFalsy()
      })
      it('should return non nullable "Recipe[]" list', () => {
        expect(recipesQuery.type).toEqual({
          kind: TypeKind.NON_NULL,
          name: null,
          ofType: {
            kind: TypeKind.LIST,
            name: null,
            ofType: {
              kind: TypeKind.NON_NULL,
              name: null,
              ofType: { kind: TypeKind.OBJECT, name: 'Recipe', ofType: null },
            },
          },
        })
      })
      it('should take 2 input arguments', () => {
        expect(recipesQuery.args.length).toEqual(2)
        expect(recipesQuery.args).toEqual(
          expect.arrayContaining([
            {
              defaultValue: '0',
              description: 'number of items to skip',
              name: 'skip',
              type: { kind: TypeKind.SCALAR, name: 'Int', ofType: null },
            },
            {
              defaultValue: '25',
              description: null,
              name: 'take',
              type: { kind: TypeKind.SCALAR, name: 'Int', ofType: null },
            },
          ]),
        )
      })
    })
    describe('Mutation: "addRecipe"', () => {
      let addRecipeMutation: IntrospectionField

      beforeAll(() => {
        addRecipeMutation = getMutationByName(introspectionSchema, 'addRecipe')
      })
      it('should not set description', () => {
        expect(addRecipeMutation.description).toEqual(null)
      })
      it('should not set as deprecated', () => {
        expect(addRecipeMutation.isDeprecated).toBeFalsy()
      })
      it('should return non nullable "Recipe" object', () => {
        expect(addRecipeMutation.type).toEqual({
          kind: TypeKind.NON_NULL,
          name: null,
          ofType: { kind: TypeKind.OBJECT, name: 'Recipe', ofType: null },
        })
      })
      it('should take "NewRecipeInput" input type object as argument', () => {
        expect(addRecipeMutation.args.length).toEqual(1)
        expect(addRecipeMutation.args).toEqual([
          {
            defaultValue: null,
            description: null,
            name: 'newRecipeData',
            type: {
              kind: TypeKind.NON_NULL,
              name: null,
              ofType: {
                kind: TypeKind.INPUT_OBJECT,
                name: 'NewRecipeInput',
                ofType: null,
              },
            },
          },
        ])
      })
    })
    describe('Subscription: "recipeAdded"', () => {
      let recipeAddedSub: IntrospectionField

      beforeAll(() => {
        recipeAddedSub = getSubscriptionByName(
          introspectionSchema,
          'recipeAdded',
        )
      })
      it('should set description', () => {
        expect(recipeAddedSub.description).toEqual('subscription description')
      })
      it('should not set as deprecated', () => {
        expect(recipeAddedSub.isDeprecated).toBeFalsy()
      })
      it('should return non nullable "Recipe" object', () => {
        expect(recipeAddedSub.type).toEqual({
          kind: TypeKind.NON_NULL,
          name: null,
          ofType: { kind: TypeKind.OBJECT, name: 'Recipe', ofType: null },
        })
      })
      it('should not take any arguments', () => {
        expect(recipeAddedSub.args.length).toEqual(0)
      })
    })
  })
})
