import path from 'path'
import { DbDrop, MigrateDev } from '@prisma/migrate'
import { PrismaClient } from '@prisma/client'
import { createYoga, YogaServerInstance } from 'graphql-yoga'
import { schema } from '../src/schema'
import type { GraphQLContext } from '../src/context'

describe('hackernews example integration', () => {
  let yoga: YogaServerInstance<Record<string, any>, GraphQLContext>
  beforeAll(async () => {
    const { createContext } = await import('../src/context')
    yoga = createYoga({ schema, context: createContext })

    // migrate
    await MigrateDev.new().parse([
      `--schema=${path.resolve(__dirname, '..', 'prisma', 'schema.prisma')}`,
    ])

    // seed
    const client = new PrismaClient()
    await client.link.create({
      data: {
        url: 'https://www.prisma.io',
        description: 'Prisma replaces traditional ORMs',
      },
    })
    await client.$disconnect()
  })

  afterAll(async () => {
    // drop
    await DbDrop.new().parse([
      `--schema=${path.resolve(__dirname, '..', 'prisma', 'schema.prisma')}`,
      '--preview-feature', // DbDrop is an experimental feature
      '--force',
    ])
  })

  it('should get posts from feed', async () => {
    const response = await yoga.fetch(
      'http://yoga/graphql?query={feed{url,description}}',
    )

    const body = await response.json()
    expect(body).toMatchInlineSnapshot(`
      {
        data: {
          feed: [
            {
              description: Prisma replaces traditional ORMs,
              url: https://www.prisma.io,
            },
          ],
        },
      }
    `)
  })

  it('should create a new post', async () => {
    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: /* GraphQL */ `
          mutation createPost {
            postLink(
              url: "https://www.the-guild.dev/graphql/yoga-server"
              description: "Time to Relax with GraphQL Yoga"
            ) {
              url
              description
            }
          }
        `,
      }),
    })

    const body = await response.json()
    expect(body).toMatchInlineSnapshot(`
      {
        data: {
          postLink: {
            description: Time to Relax with GraphQL Yoga,
            url: https://www.the-guild.dev/graphql/yoga-server,
          },
        },
      }
    `)
  })
})
