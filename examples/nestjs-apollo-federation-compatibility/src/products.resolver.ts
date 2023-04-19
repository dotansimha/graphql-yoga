import {
  Args,
  Parent,
  Query,
  ResolveField,
  Resolver,
  ResolveReference,
} from '@nestjs/graphql'

interface ProductVariation {
  id: string
}

interface Product {
  id: string
  sku: string
  package: string
  variation: ProductVariation
}

const products: Product[] = [
  {
    id: 'apollo-federation',
    sku: 'federation',
    package: '@apollo/federation',
    variation: {
      id: 'OSS',
    },
  },
  {
    id: 'apollo-studio',
    sku: 'studio',
    package: '',
    variation: {
      id: 'platform',
    },
  },
]

@Resolver('Product')
export class ProductsResolver {
  constructor() {}

  @Query()
  product(@Args('id') id: string) {
    return products.find((p) => p.id == id)
  }

  @ResolveField('variation')
  getVariation(@Parent() parent: Product) {
    if (parent.variation) return { id: parent.variation.id }
    return { id: products.find((p) => p.id == parent.id)?.variation.id }
  }

  @ResolveField('dimensions')
  getDimensions() {
    return { size: 'small', weight: 1, unit: 'kg' }
  }

  @ResolveField('createdBy')
  getCreatedBy() {
    return { email: 'support@apollographql.com', totalProductsCreated: 1337 }
  }

  @ResolveField('research')
  getResearch(@Parent() parent: Product) {
    if (parent.id === 'apollo-federation') {
      return [
        {
          study: {
            caseNumber: '1234',
            description: 'Federation Study',
          },
        },
      ]
    } else if (parent.id === 'apollo-studio') {
      return [
        {
          study: {
            caseNumber: '1235',
            description: 'Studio Study',
          },
        },
      ]
    } else {
      return []
    }
  }

  @ResolveReference()
  resolveReference(productRef: Product) {
    if (productRef.id) {
      return products.find((p) => p.id == productRef.id)
    } else if (productRef.sku && productRef.package) {
      return products.find(
        (p) => p.sku == productRef.sku && p.package == productRef.package,
      )
    } else {
      return products.find(
        (p) =>
          p.sku == productRef.sku && p.variation.id == productRef.variation.id,
      )
    }
  }
}
