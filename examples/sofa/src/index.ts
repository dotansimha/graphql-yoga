import { createServer } from 'http'

import { infoColor, titleBold } from 'graphql-yoga'

import { yoga } from './yoga'

const server = createServer(yoga)

server.listen(4000, async () => {
  const url = `http://localhost:4000`

  function printUrl(path: string) {
    return infoColor(url + path)
  }

  console.log(`
    ${titleBold('Swagger UI: ')}    ${printUrl('/swagger')}

    ${titleBold('GraphQL:')}        ${printUrl('/graphql')}

    ${titleBold('Queries:')}
      me:           ${printUrl('/rest/me')}
      users:        ${printUrl('/rest/users')}
      user:         ${printUrl('/rest/user/1')}
      books:        ${printUrl('/rest/books')}
      book:         ${printUrl('/rest/book/1')}

    ${titleBold('Mutations:')}
      addBook:      ${printUrl('/rest/add-book')} ${infoColor('POST: {title}')}
  `)
})
