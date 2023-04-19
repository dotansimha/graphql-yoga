import { ResolveField, Resolver, ResolveReference } from '@nestjs/graphql'

interface CaseStudy {
  caseNumber: string
  description: string
}

interface ProductResearch {
  study: CaseStudy
  outcome: string
}

const productResearch = [
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

@Resolver('ProductResearch')
export class ProductResearchResolver {
  constructor() {}

  @ResolveField()
  getStudy() {
    return productResearch[0].study
  }

  @ResolveReference()
  resolveReference(reference: ProductResearch) {
    return productResearch.find(
      (p) => reference.study.caseNumber === p.study.caseNumber,
    )
  }
}
