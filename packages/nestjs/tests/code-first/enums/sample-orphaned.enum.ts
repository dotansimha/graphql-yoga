import { registerEnumType } from '@nestjs/graphql'

export enum SampleOrphanedEnum {
  Red = 'RED',
  Blue = 'BLUE',
  Black = 'BLACK',
  White = 'WHITE',
}

registerEnumType(SampleOrphanedEnum, {
  name: 'SampleOrphanedEnum',
  description: 'orphaned enum',
})
