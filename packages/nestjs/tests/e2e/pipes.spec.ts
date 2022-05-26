import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import * as request from 'supertest'
import { ApplicationModule } from '../code-first/app.module'

describe('GraphQL - Pipes', () => {
  let app: INestApplication

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile()

    app = module.createNestApplication()
    app.useGlobalPipes(new ValidationPipe())
    await app.init()
  })

  it(`should throw an error`, () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: {},
        query:
          'mutation {\n  addRecipe(newRecipeData: {title: "test", ingredients: []}) {\n    id\n  }\n}\n',
      })
      .expect(200, {
        errors: [
          {
            message: 'Bad Request Exception',
            locations: [{ line: 2, column: 3 }],
            path: ['addRecipe'],
            extensions: {
              code: 'INTERNAL_SERVER_ERROR',
              exception: {
                response: {
                  statusCode: 400,
                  message: [
                    'description must be longer than or equal to 30 characters',
                  ],
                  error: 'Bad Request',
                },
                status: 400,
                message: 'Bad Request Exception',
                name: 'BadRequestException',
              },
            },
          },
        ],
        data: null,
      })
  })

  afterEach(async () => {
    await app.close()
  })
})
