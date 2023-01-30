import { buildSubgraphSchema } from '@apollo/subgraph'
import { useApolloInlineTrace } from '@graphql-yoga/plugin-apollo-inline-trace'
import { createYoga } from 'graphql-yoga'
import { createServer } from 'http'
import { gql } from 'graphql-tag'
import { readFileSync } from 'node:fs'

import { Product, ProductResearch, Resolvers, User } from './resolvers-types'

const typeDefs = readFileSync('./products.graphql', 'utf8')

const productResearch: ProductResearch[] = [
  {
    study: {
      caseNumber: '1234',
      description: 'Federation Study',
    },
  },
  {
    study: {
      caseNumber: '1235',
      description: 'Studio Study',
    },
  },
]

const products: Omit<Product, 'research'>[] = [
  {
    id: 'apollo-federation',
    sku: 'federation',
    package: '@apollo/federation',
    variation: { id: 'OSS', __typename: 'ProductVariation' },
  },
  {
    id: 'apollo-studio',
    sku: 'studio',
    package: '',
    variation: { id: 'platform', __typename: 'ProductVariation' },
  },
]

const deprecatedProduct = {
  sku: 'apollo-federation-v1',
  package: '@apollo/federation-v1',
  reason: 'Migrate to Federation V2',
}

const user: User = {
  email: 'support@apollographql.com',
  name: 'Jane Smith',
  totalProductsCreated: 1337,
  yearsOfEmployment: 10,
}

const resolvers: Resolvers = {
  Query: {
    product(_: unknown, args: { id: string }) {
      return products.find((p) => p.id == args.id)! as unknown as Product
    },
    deprecatedProduct: (_, args, context) => {
      if (
        args.sku === deprecatedProduct.sku &&
        args.package === deprecatedProduct.package
      ) {
        return deprecatedProduct
      } else {
        return null
      }
    },
  },
  DeprecatedProduct: {
    createdBy: () => {
      return user
    },
    __resolveReference: (reference) => {
      if (
        reference.sku === deprecatedProduct.sku &&
        reference.package === deprecatedProduct.package
      ) {
        return deprecatedProduct
      } else {
        return null
      }
    },
  },
  ProductResearch: {
    __resolveReference: (reference) => {
      return productResearch.find(
        (p) => reference.study.caseNumber === p.study.caseNumber,
      )!
    },
  },
  Product: {
    variation(parent) {
      if (parent.variation) return parent.variation
      const p = products.find((p) => p.id == parent.id)
      return p && p.variation ? p.variation : null
    },

    research: (reference) => {
      if (reference.id === 'apollo-federation') {
        return [productResearch[0]]
      } else if (reference.id === 'apollo-studio') {
        return [productResearch[1]]
      } else {
        return []
      }
    },

    dimensions() {
      return { size: 'small', weight: 1, unit: 'kg' }
    },

    createdBy() {
      return user
    },

    __resolveReference(productRef) {
      // will be improved in the future: https://github.com/dotansimha/graphql-code-generator/pull/5645
      let ref = productRef as Product
      if (ref.id) {
        return (products.find((p) => p.id == ref.id) ||
          null) as unknown as Product
      } else if (ref.sku && ref.package) {
        return (products.find(
          (p) => p.sku == ref.sku && p.package == ref.package,
        ) || null) as unknown as Product
      } else {
        return (products.find(
          (p) =>
            p.sku == ref.sku &&
            p.variation &&
            ref.variation &&
            p.variation.id == ref.variation.id,
        ) || null) as unknown as Product
      }
    },
  },
  User: {
    averageProductsCreatedPerYear: (user, args, context) => {
      if (user.email != 'support@apollographql.com') {
        throw new Error("user.email was not 'support@apollographql.com'")
      }
      return Math.round(
        (user.totalProductsCreated || 0) / user.yearsOfEmployment,
      )
    },
    name() {
      return 'Jane Smith'
    },
  },
}

const yoga = createYoga({
  schema: buildSubgraphSchema([{ typeDefs: gql(typeDefs), resolvers }]),
  graphqlEndpoint: '/',
  plugins: [useApolloInlineTrace()],
})

const server = createServer(yoga)

server.listen(4001)

console.log(`🚀 Server ready at http://localhost:4001`)
