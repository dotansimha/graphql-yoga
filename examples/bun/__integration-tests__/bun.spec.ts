import { spawn } from 'child_process'
import { fetch } from '@whatwg-node/fetch'

describe('Bun integration', () => {
  let bunProcess: ReturnType<typeof spawn>
  let serverUrl: string

  beforeAll(async () => {
    // Start Bun
    bunProcess = spawn('yarn', ['workspace', 'example-bun', 'start'])

    serverUrl = await new Promise((resolve, reject) => {
      bunProcess.stderr?.on('data', (chunk) => {
        const chunkString = chunk.toString('utf-8')
        console.error(chunk.toString('utf-8'))
        if (chunkString.includes('Command failed')) {
          reject(new Error('Bun failed to start'))
        }
      })

      bunProcess.stdout?.on('data', (chunk) => {
        const chunkString = chunk.toString('utf-8')
        console.log(chunk.toString('utf-8'))
        if (chunkString.includes('Server is running on')) {
          resolve(chunkString.split('Server is running on ')[1])
        }
      })
    })
  })

  afterAll(() => {
    bunProcess.kill()
  })

  it('shows GraphiQL', async () => {
    const response = await fetch(serverUrl, {
      method: 'GET',
      headers: {
        Accept: 'text/html',
      },
    })
    expect(response.status).toEqual(200)
    expect(response.headers.get('content-type')).toEqual('text/html')
    const htmlContents = await response.text()
    expect(htmlContents).toContain('Yoga GraphiQL')
  })

  it('accepts a query', async () => {
    const response = await fetch(serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `{ greetings }`,
      }),
    })
    const result = await response.json()
    expect(result).toEqual({
      data: {
        greetings: 'Hello Bun!',
      },
    })
  })
})
