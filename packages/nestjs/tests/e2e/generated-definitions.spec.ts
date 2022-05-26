import { INestApplication } from '@nestjs/common'
import {
  GraphQLFactory,
  GraphQLFederationDefinitionsFactory,
} from '@nestjs/graphql'
import { Test } from '@nestjs/testing'
import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'
import { ApplicationModule } from '../code-first/app.module'

const readFile = util.promisify(fs.readFile)

const generatedDefinitions = (fileName) =>
  path.join(__dirname, '..', 'generated-definitions', fileName)

describe('Generated Definitions', () => {
  let app: INestApplication
  let graphqlFactory: GraphQLFactory

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile()

    app = module.createNestApplication()
    await app.init()

    graphqlFactory = app.get<GraphQLFactory>(GraphQLFactory)
  })

  it('should generate interface definitions for types', async () => {
    const typeDefs = await readFile(
      generatedDefinitions('simple-type.graphql'),
      'utf8',
    )

    const outputFile = generatedDefinitions('simple-type.test-definitions.ts')
    await graphqlFactory.generateDefinitions(typeDefs, {
      definitions: {
        path: outputFile,
      },
    })

    expect(
      await readFile(generatedDefinitions('simple-type.fixture.ts'), 'utf8'),
    ).toBe(await readFile(outputFile, 'utf8'))
  })

  it('should generate properties referencing other interfaces', async () => {
    const typeDefs = await readFile(
      generatedDefinitions('interface-property.graphql'),
      'utf8',
    )

    const outputFile = generatedDefinitions(
      'interface-property.test-definitions.ts',
    )
    await graphqlFactory.generateDefinitions(typeDefs, {
      definitions: {
        path: outputFile,
      },
    })

    expect(
      await readFile(
        generatedDefinitions('interface-property.fixture.ts'),
        'utf8',
      ),
    ).toBe(await readFile(outputFile, 'utf8'))
  })

  it('should generate array properties with correct optionality', async () => {
    const typeDefs = await readFile(
      generatedDefinitions('array-property.graphql'),
      'utf8',
    )

    const outputFile = generatedDefinitions(
      'array-property.test-definitions.ts',
    )
    await graphqlFactory.generateDefinitions(typeDefs, {
      definitions: {
        path: outputFile,
      },
    })

    expect(
      await readFile(generatedDefinitions('array-property.fixture.ts'), 'utf8'),
    ).toBe(await readFile(outputFile, 'utf8'))
  })

  it('should generate queries', async () => {
    const typeDefs = await readFile(
      generatedDefinitions('query.graphql'),
      'utf8',
    )

    const outputFile = generatedDefinitions('query.test-definitions.ts')
    await graphqlFactory.generateDefinitions(typeDefs, {
      definitions: {
        path: outputFile,
      },
    })

    expect(
      await readFile(generatedDefinitions('query.fixture.ts'), 'utf8'),
    ).toBe(await readFile(outputFile, 'utf8'))
  })

  it('should generate queries with methods as fields (skipResolverArgs: true)', async () => {
    const typeDefs = await readFile(
      generatedDefinitions('query.graphql'),
      'utf8',
    )

    const outputFile = generatedDefinitions(
      'query-skip-args.test-definitions.ts',
    )
    await graphqlFactory.generateDefinitions(typeDefs, {
      definitions: {
        path: outputFile,
        skipResolverArgs: true,
      },
    })

    expect(
      await readFile(
        generatedDefinitions('query-skip-args.fixture.ts'),
        'utf8',
      ),
    ).toBe(await readFile(outputFile, 'utf8'))
  })

  it('should generate mutations', async () => {
    const typeDefs = await readFile(
      generatedDefinitions('mutation.graphql'),
      'utf8',
    )

    const outputFile = generatedDefinitions('mutation.test-definitions.ts')
    await graphqlFactory.generateDefinitions(typeDefs, {
      definitions: {
        path: outputFile,
      },
    })

    expect(
      await readFile(generatedDefinitions('mutation.fixture.ts'), 'utf8'),
    ).toBe(await readFile(outputFile, 'utf8'))
  })

  it('should generate enums', async () => {
    const typeDefs = await readFile(
      generatedDefinitions('enum.graphql'),
      'utf8',
    )

    const outputFile = generatedDefinitions('enum.test-definitions.ts')
    await graphqlFactory.generateDefinitions(typeDefs, {
      definitions: {
        path: outputFile,
      },
    })

    expect(
      await readFile(generatedDefinitions('enum.fixture.ts'), 'utf8'),
    ).toBe(await readFile(outputFile, 'utf8'))
  })

  it('should generate enums as types', async () => {
    const typeDefs = await readFile(
      generatedDefinitions('enum-as-type.graphql'),
      'utf8',
    )

    const outputFile = generatedDefinitions('enum-as-type.test-definitions.ts')
    await graphqlFactory.generateDefinitions(typeDefs, {
      definitions: {
        path: outputFile,
        enumsAsTypes: true,
      },
    })

    expect(
      await readFile(generatedDefinitions('enum-as-type.fixture.ts'), 'utf8'),
    ).toBe(await readFile(outputFile, 'utf8'))
  })

  it('should generate custom scalars', async () => {
    const typeDefs = await readFile(
      generatedDefinitions('custom-scalar.graphql'),
      'utf8',
    )

    const outputFile = generatedDefinitions('custom-scalar.test-definitions.ts')
    await graphqlFactory.generateDefinitions(typeDefs, {
      definitions: {
        path: outputFile,
      },
    })

    expect(
      await readFile(generatedDefinitions('custom-scalar.fixture.ts'), 'utf8'),
    ).toBe(await readFile(outputFile, 'utf8'))
  })

  it('should generate custom scalars with a default type', async () => {
    const typeDefs = await readFile(
      generatedDefinitions('custom-scalar.graphql'),
      'utf8',
    )

    const outputFile = generatedDefinitions(
      'custom-scalar-default-type.test-definitions.ts',
    )
    await graphqlFactory.generateDefinitions(typeDefs, {
      definitions: {
        path: outputFile,
        defaultScalarType: 'unknown',
      },
    })

    expect(
      await readFile(
        generatedDefinitions('custom-scalar-default-type.fixture.ts'),
        'utf8',
      ),
    ).toBe(await readFile(outputFile, 'utf8'))
  })

  it('should generate custom scalars with a type mapping', async () => {
    const typeDefs = await readFile(
      generatedDefinitions('custom-scalar-type-mapping.graphql'),
      'utf8',
    )

    const outputFile = generatedDefinitions(
      'custom-scalar-type-mapping.test-definitions.ts',
    )
    await graphqlFactory.generateDefinitions(typeDefs, {
      definitions: {
        path: outputFile,
        customScalarTypeMapping: {
          List: 'string[]',
          Point: '[number, number]',
          DateTime: Date,
        },
      },
    })

    expect(
      await readFile(
        generatedDefinitions('custom-scalar-type-mapping.fixture.ts'),
        'utf8',
      ),
    ).toBe(await readFile(outputFile, 'utf8'))
  })

  it('should prepend a custom header', async () => {
    const typeDefs = await readFile(
      generatedDefinitions('custom-header.graphql'),
      'utf8',
    )

    const outputFile = generatedDefinitions('custom-header.test-definitions.ts')
    await graphqlFactory.generateDefinitions(typeDefs, {
      definitions: {
        path: outputFile,
        additionalHeader: '/* Put anything here you like */',
      },
    })

    expect(
      await readFile(generatedDefinitions('custom-header.fixture.ts'), 'utf8'),
    ).toBe(await readFile(outputFile, 'utf8'))
  })

  it('should generate for a federated graph', async () => {
    const outputFile = generatedDefinitions('federation.test-definitions.ts')
    const factory = new GraphQLFederationDefinitionsFactory()
    await factory.generate({
      typePaths: [generatedDefinitions('federation.graphql')],
      path: outputFile,
      outputAs: 'class',
    })

    expect(
      await readFile(generatedDefinitions('federation.fixture.ts'), 'utf8'),
    ).toBe(await readFile(outputFile, 'utf8'))
  })

  it('should generate for a federated graph with typeDef', async () => {
    const outputFile = generatedDefinitions(
      'federation-typedef.test-definitions.ts',
    )
    const factory = new GraphQLFederationDefinitionsFactory()
    await factory.generate({
      typePaths: [generatedDefinitions('federation-typedef.graphql')],
      typeDefs: `enum Animal {
        DOG
        CAT
      }`,
      path: outputFile,
      outputAs: 'class',
    })

    expect(
      await readFile(
        generatedDefinitions('federation-typedef.fixture.ts'),
        'utf8',
      ),
    ).toBe(await readFile(outputFile, 'utf8'))
  })

  it('should generate with __typename field for each object type', async () => {
    const typeDefs = await readFile(
      generatedDefinitions('typename.graphql'),
      'utf8',
    )

    const outputFile = generatedDefinitions('typename.test-definitions.ts')
    await graphqlFactory.generateDefinitions(typeDefs, {
      definitions: {
        path: outputFile,
        emitTypenameField: true,
      },
    })

    expect(
      await readFile(generatedDefinitions('typename.fixture.ts'), 'utf8'),
    ).toBe(await readFile(outputFile, 'utf8'))
  })

  afterEach(async () => {
    await app.close()
  })
})
