export const printedSchemaSnapshot = `# ------------------------------------------------------
# THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
# ------------------------------------------------------

"""example interface"""
interface IRecipe {
  id: ID!
  title: String!
  interfaceResolver(arg: Float): Boolean!
}

"""recipe object type"""
type Recipe implements IRecipe {
  id: ID!
  title: String!
  interfaceResolver(arg: Float): Boolean!
  description: String
  creationDate: DateTime!
  averageRating: Float!

  """last rate description"""
  lastRate: Float
  tags: [String!]!
  ingredients: [Ingredient!]!
  count(type: String, status: String): Float!
  rating: Float!
}

"""
A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format.
"""
scalar DateTime

"""orphaned type"""
type SampleOrphanedType {
  id: ID!
  title: String!
  description: String
  creationDate: DateTime!
  averageRating: Float!
}

type Category {
  name: String!
  description: String!
  tags: [String!]!
}

type Ingredient {
  id: ID!

  """ingredient name"""
  name: String @deprecated(reason: "is deprecated")
}

"""orphaned enum"""
enum SampleOrphanedEnum {
  Red
  Blue
  Black
  White
}

type Query {
  """get recipe by id"""
  recipe(
    """recipe id"""
    id: String = "1"
  ): IRecipe!
  search: [SearchResultUnion!]! @deprecated(reason: "test")
  categories: [Category!]!
  recipes(
    """number of items to skip"""
    skip: Int = 0
    take: Int = 25
  ): [Recipe!]!
  move(direction: Direction!): Direction!
}

"""Search result description"""
union SearchResultUnion = Ingredient | Recipe

"""The basic directions"""
enum Direction {
  """The primary direction"""
  Up
  Down
  Left
  Right
  Sideways @deprecated(reason: "Replaced with Left or Right")
}

type Mutation {
  addRecipe(newRecipeData: NewRecipeInput!): Recipe!
  removeRecipe(id: String!): Boolean!
}

"""new recipe input"""
input NewRecipeInput {
  """recipe title"""
  title: String!
  description: String
  ingredients: [String!]!
}

type Subscription {
  """subscription description"""
  recipeAdded: Recipe!
}
`

export const sortedPrintedSchemaSnapshot = `# ------------------------------------------------------
# THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
# ------------------------------------------------------

type Category {
  description: String!
  name: String!
  tags: [String!]!
}

"""Date custom scalar type"""
scalar Date

"""The basic directions"""
enum Direction {
  Down
  Left
  Right
  Sideways @deprecated(reason: "Replaced with Left or Right")

  """The primary direction"""
  Up
}

"""example interface"""
interface IRecipe {
  id: ID!
  interfaceResolver(arg: Float): Boolean!
  title: String!
}

type Ingredient {
  id: ID!

  """ingredient name"""
  name: String @deprecated(reason: "is deprecated")
}

type Mutation {
  addRecipe(newRecipeData: NewRecipeInput!): Recipe!
  removeRecipe(id: String!): Boolean!
}

"""new recipe input"""
input NewRecipeInput {
  description: String
  ingredients: [String!]!

  """recipe title"""
  title: String!
}

type Query {
  categories: [Category!]!
  move(direction: Direction!): Direction!

  """get recipe by id"""
  recipe(
    """recipe id"""
    id: String = "1"
  ): IRecipe!
  recipes(
    """number of items to skip"""
    skip: Int = 0
    take: Int = 25
  ): [Recipe!]!
  search: [SearchResultUnion!]! @deprecated(reason: "test")
}

"""recipe object type"""
type Recipe implements IRecipe {
  averageRating: Float!
  count(status: String, type: String): Float!
  creationDate: Date!
  description: String
  id: ID!
  ingredients: [Ingredient!]!
  interfaceResolver(arg: Float): Boolean!

  """last rate description"""
  lastRate: Float
  rating: Float!
  tags: [String!]!
  title: String!
}

"""Search result description"""
union SearchResultUnion = Ingredient | Recipe

type Subscription {
  """subscription description"""
  recipeAdded: Recipe!
}
`
