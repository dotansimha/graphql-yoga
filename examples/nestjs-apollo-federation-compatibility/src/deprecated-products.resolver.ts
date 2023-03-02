import {
  Args,
  Query,
  ResolveField,
  Resolver,
  ResolveReference,
} from '@nestjs/graphql'

interface User {
  email: string
  name: string
  totalProductsCreated: number
}

interface DeprecatedProduct {
  sku: string
  package: string
  reason: string
  createdBy: User
}

const user = {
  email: 'support@apollographql.com',
  name: 'Jane Smith',
  totalProductsCreated: 1337,
}

const deprecatedProduct = {
  sku: 'apollo-federation-v1',
  package: '@apollo/federation-v1',
  reason: 'Migrate to Federation V2',
}

@Resolver('DeprecatedProduct')
export class DeprecatedProductsResolver {
  constructor() {}

  @Query()
  deprecatedProduct(
    @Args('sku') sku: string,
    @Args('package') packageName: string,
  ) {
    return sku === deprecatedProduct.sku &&
      packageName === deprecatedProduct.package
      ? deprecatedProduct
      : null
  }

  @ResolveField('createdBy')
  getCreatedBy() {
    return user
  }

  @ResolveReference()
  resolveReference(reference: DeprecatedProduct) {
    if (
      reference.sku === deprecatedProduct.sku &&
      reference.package === deprecatedProduct.package
    ) {
      return deprecatedProduct
    } else {
      return null
    }
  }
}
