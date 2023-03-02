import {
  YogaFederationDriver,
  YogaFederationDriverConfig,
} from '@graphql-yoga/nestjs'
import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { DeprecatedProductsResolver } from './deprecated-products.resolver'
import { InventoryResolver } from './inventory.resolver'
import { ProductResearchResolver } from './product-research.resolver'
import { ProductsResolver } from './products.resolver'
import { UsersResolver } from './users.resolver'

@Module({
  imports: [
    GraphQLModule.forRoot<YogaFederationDriverConfig>({
      driver: YogaFederationDriver,
      typePaths: ['**/*.graphql'],
      path: '/',
    }),
  ],
  providers: [
    UsersResolver,
    ProductsResolver,
    ProductResearchResolver,
    DeprecatedProductsResolver,
    InventoryResolver,
  ],
})
export class AppModule {}
