import { yoga } from './yoga'
import { createServer } from 'http'
import * as chalk from 'chalk'

const server = createServer(yoga)

server.listen(4000, async () => {
  const url = `http://localhost:4000`

  function printUrl(path: string) {
    return chalk.gray(url + path)
  }

  console.log(`
    ${chalk.bold('Swagger UI: ')}    ${printUrl('/swagger')}

    ${chalk.bold('GraphQL:')}        ${printUrl('/graphql')}

    ${chalk.bold('Queries:')}
      me:           ${printUrl('/rest/me')}
      users:        ${printUrl('/rest/users')}
      user:         ${printUrl('/rest/user/1')}
      books:        ${printUrl('/rest/books')}
      book:         ${printUrl('/rest/book/1')}

    ${chalk.bold('Mutations:')}
      addBook:      ${printUrl('/rest/add-book')} ${chalk.italic.gray(
    'POST: {title}',
  )}
  `)
})
