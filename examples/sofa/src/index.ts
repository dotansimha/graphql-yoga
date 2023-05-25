import { yoga, restEndpoint } from './yoga'
import { createServer } from 'node:http'

const server = createServer(yoga)

server.listen(4000, async () => {
  const url = `http://localhost:4000`

  function printUrl(path: string) {
    return url + path
  }

  console.log(`
    ${'Swagger UI: '}    ${printUrl(`${restEndpoint}/docs`)}

    ${'GraphQL:'}        ${printUrl(yoga.graphqlEndpoint)}

    ${'Queries:'}
      me:           ${printUrl(`${restEndpoint}/me`)}
      users:        ${printUrl(`${restEndpoint}/users`)}
      user:         ${printUrl(`${restEndpoint}/user/1`)}
      books:        ${printUrl(`${restEndpoint}/books`)}
      book:         ${printUrl(`${restEndpoint}/book/1`)}

    ${'Mutations:'}
      addBook:      ${printUrl(`${restEndpoint}/add-book`)} ${'POST: {title}'}
  `)
})
