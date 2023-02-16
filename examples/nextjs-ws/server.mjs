import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port })

;(async () => {
  await app.prepare()

  const handle = app.getRequestHandler()

  const server = createServer(async (req, res) => {
    try {
      await handle(
        req,
        res,
        // Be sure to pass `true` as the second argument to `url.parse`.
        // This tells it to parse the query portion of the URL.
        parse(req.url, true),
      )
    } catch (err) {
      console.error(`Error while handling ${req.url}`, err)
      res.writeHead(500).end()
    }
  })

  await new Promise((resolve, reject) =>
    server.listen(port, (err) => (err ? reject(err) : resolve())),
  )

  console.log(`> Ready on http://${hostname}:${port}`)
})()
