import { Resolver, ResolveReference } from '@nestjs/graphql'

interface DeprecatedProduct {
  sku: string
  package: string
  reason: string
}

interface Inventory {
  id: string
  deprecatedProducts: [DeprecatedProduct]
}

const inventory = {
  id: 'apollo-oss',
  deprecatedProducts: [
    {
      sku: 'apollo-federation-v1',
      package: '@apollo/federation-v1',
      reason: 'Migrate to Federation V2',
    },
  ],
}

@Resolver('Inventory')
export class InventoryResolver {
  constructor() {}

  @ResolveReference()
  resolveReference(reference: Inventory) {
    if (reference.id == inventory.id) {
      return inventory
    } else {
      return null
    }
  }
}
