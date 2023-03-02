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

it('should subscribe using sse', async () => {
  const sub = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      query: /* GraphQL */ `
        subscription {
          greetings
        }
      `,
    }),
  })

  await expect(sub.text()).resolves.toMatchInlineSnapshot(`
    "data: {"data":{"greetings":"Hi"}}

    data: {"data":{"greetings":"Bonjour"}}

    data: {"data":{"greetings":"Hola"}}

    data: {"data":{"greetings":"Ciao"}}

    data: {"data":{"greetings":"Zdravo"}}

    "
  `)
})
