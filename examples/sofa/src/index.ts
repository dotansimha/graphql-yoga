import { yoga, restEndpoint } from './yoga'
import { createServer } from 'http'
import { titleBold, infoColor } from 'graphql-yoga'

const server = createServer(yoga)

server.listen(4000, async () => {
  const url = `http://localhost:4000`

  function printUrl(path: string) {
    return infoColor(url + path)
  }

  console.log(`
    ${titleBold('Swagger UI: ')}    ${printUrl(`${restEndpoint}/docs`)}

    ${titleBold('GraphQL:')}        ${printUrl(yoga.graphqlEndpoint)}

    ${titleBold('Queries:')}
      me:           ${printUrl(`${restEndpoint}/me`)}
      users:        ${printUrl(`${restEndpoint}/users`)}
      user:         ${printUrl(`${restEndpoint}/user/1`)}
      books:        ${printUrl(`${restEndpoint}/books`)}
      book:         ${printUrl(`${restEndpoint}/book/1`)}

    ${titleBold('Mutations:')}
      addBook:      ${printUrl(`${restEndpoint}/add-book`)} ${infoColor(
    'POST: {title}',
  )}
  `)
})
