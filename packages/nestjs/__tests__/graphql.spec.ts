import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { fetch } from '@whatwg-node/fetch'
import { AppModule } from './fixtures/graphql/app.module'

let app: INestApplication, url: string

beforeAll(async () => {
  const module = await Test.createTestingModule({
    imports: [AppModule.forRoot()],
  }).compile()
  app = module.createNestApplication()
  await app.listen(0)
  url = (await app.getUrl()) + '/graphql'
})

afterAll(() => app.close())

it('should return query result', async () => {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      query: /* GraphQL */ `
        {
          getCats {
            id
            color
            weight
          }
        }
      `,
    }),
  })
  await expect(res.json()).resolves.toMatchInlineSnapshot(`
    {
      "data": {
        "getCats": [
          {
            "color": "black",
            "id": 1,
            "weight": 5,
          },
        ],
      },
    }
  `)
})
