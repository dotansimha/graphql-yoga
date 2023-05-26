import { ResolveField, Resolver } from '@nestjs/graphql'

@Resolver('User')
export class UsersResolver {
  @ResolveField('name')
  getName() {
    return 'Jane Smith'
  }

  @ResolveField('averageProductsCreatedPerYear')
  getAverageProductsCreatedPerYear({
    totalProductsCreated,
    yearsOfEmployment,
  }) {
    return totalProductsCreated
      ? Math.round(totalProductsCreated / yearsOfEmployment)
      : null
  }
}
