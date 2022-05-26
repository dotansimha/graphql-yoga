import { Module } from '@nestjs/common'
import { DirectionsResolver } from './directions.resolver'

@Module({
  providers: [DirectionsResolver],
})
export class DirectionsModule {}
