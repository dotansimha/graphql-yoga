import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { gql } from 'graphql-tag';
import { createYoga } from 'graphql-yoga';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { useApolloInlineTrace } from '@graphql-yoga/plugin-apollo-inline-trace';
import { Inventory, Product, ProductResearch, Resolvers, User } from './resolvers-types';

const typeDefs = readFileSync('./schema.graphql', 'utf8');

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
];

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
];

const deprecatedProduct = {
  sku: 'apollo-federation-v1',
  package: '@apollo/federation-v1',
  reason: 'Migrate to Federation V2',
};

const user: User = {
  email: 'support@apollographql.com',
  name: 'Jane Smith',
  totalProductsCreated: 1337,
  yearsOfEmployment: 10,
};

const inventory: Inventory = {
  id: 'apollo-oss',
  deprecatedProducts: [deprecatedProduct],
};

const resolvers: Resolvers = {
  Query: {
    product(_: unknown, args: { id: string }) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return products.find(p => p.id === args.id)! as unknown as Product;
    },
    deprecatedProduct: (_, args) => {
      if (args.sku === deprecatedProduct.sku && args.package === deprecatedProduct.package) {
        return deprecatedProduct;
      }
      return null;
    },
  },
  DeprecatedProduct: {
    createdBy: () => {
      return user;
    },
    __resolveReference: reference => {
      if (
        reference.sku === deprecatedProduct.sku &&
        reference.package === deprecatedProduct.package
      ) {
        return deprecatedProduct;
      }
      return null;
    },
  },
  ProductResearch: {
    __resolveReference: reference => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return productResearch.find(p => reference.study.caseNumber === p.study.caseNumber)!;
    },
  },
  Product: {
    variation(parent) {
      if (parent.variation) return parent.variation;
      const p = products.find(p => p.id === parent.id);
      return p?.variation || null;
    },

    research: reference => {
      if (reference.id === 'apollo-federation') {
        return [productResearch[0]];
      }
      if (reference.id === 'apollo-studio') {
        return [productResearch[1]];
      }
      return [];
    },

    dimensions() {
      return { size: 'small', weight: 1, unit: 'kg' };
    },

    createdBy() {
      return user;
    },

    __resolveReference(productRef) {
      // will be improved in the future: https://github.com/dotansimha/graphql-code-generator/pull/5645
      const ref = productRef as Product;
      if (ref.id) {
        return (products.find(p => p.id === ref.id) || null) as unknown as Product;
      }
      if (ref.sku && ref.package) {
        return (products.find(p => p.sku === ref.sku && p.package === ref.package) ||
          null) as unknown as Product;
      }
      return (products.find(
        p =>
          p.sku === ref.sku && p.variation && ref.variation && p.variation.id === ref.variation.id,
      ) || null) as unknown as Product;
    },
  },
  User: {
    averageProductsCreatedPerYear: user => {
      if (user.email !== 'support@apollographql.com') {
        throw new Error("user.email was not 'support@apollographql.com'");
      }
      return Math.round((user.totalProductsCreated || 0) / user.yearsOfEmployment);
    },
    name() {
      return 'Jane Smith';
    },
    // @ts-expect-error I have no idea for the reason of this error. I am just the guy that has to fix the broken eslint setup.
    __resolveReference(userRef) {
      const ref = userRef as User;
      if (ref.email) {
        const user = {
          email: ref.email,
          name: 'Jane Smith',
          totalProductsCreated: 1337,
        };
        if (ref.totalProductsCreated) {
          user.totalProductsCreated = ref.totalProductsCreated;
        }
        if (ref.yearsOfEmployment) {
          // @ts-expect-error I have no idea for the reason of this error. I am just the guy that has to fix the broken eslint setup.
          user.yearsOfEmployment = ref.yearsOfEmployment;
        }
        return user;
      }
      return null;
    },
  },
  Inventory: {
    __resolveReference: reference => {
      if (inventory.id === reference.id) {
        return inventory;
      }
      return null;
    },
  },
};

const yoga = createYoga({
  schema: buildSubgraphSchema([{ typeDefs: gql(typeDefs), resolvers }]),
  plugins: [useApolloInlineTrace()],
});

const server = createServer(yoga);

server.listen(4001, () => {
  console.log(`🚀 Server ready at http://localhost:4001`);
});
