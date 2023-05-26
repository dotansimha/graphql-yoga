import { rejects } from 'node:assert'
import { exec } from 'node:child_process'
import { join, resolve } from 'node:path'
import { Readable, finished } from 'node:stream'

describeIf(!!global.fetch)('nextjs 13 App Router', () => {
  it('should show GraphiQL', async () => {
    const response = await fetch('http://127.0.0.1:3333/api/graphql', {
      headers: {
        accept: 'text/html',
      },
    })

    expect(response.ok).toBe(true)
    expect(await response.text()).toContain('<title>Yoga GraphiQL</title>')
  })

  it('should run basic query', async () => {
    const response = await fetch('http://127.0.0.1:3333/api/graphql', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        query: 'query { greetings }',
      }),
    })

    expect(response.ok).toBe(true)

    const json = await response.json()

    expect(json.errors).toBeFalsy()
    expect(json.data?.greetings).toBe(
      'This is the `greetings` field of the root `Query` type',
    )
  })

  jest.setTimeout(1000 * 60 * 5)
  let serverProcess: ReturnType<typeof cmd>
  let buildProcess: ReturnType<typeof cmd>

  beforeAll(async () => {
    buildProcess = cmd('pnpm build')
    await buildProcess.exited
    serverProcess = cmd('PORT=3333 pnpm start')
    await waitForEndpoint('http://127.0.0.1:3333', 5, 1000)
  })

  afterAll(async () => {
    await buildProcess?.stop()
    await serverProcess?.stop().catch(() => {})
  })
})

function cmd(cmd: string) {
  const cp = exec(cmd, {
    cwd: join(module.path, '..'),
    timeout: 1000 * 60 * 1,
  })

  const getStdout = saveOut(cp.stdout!)
  const getStderr = saveOut(cp.stderr!)

  const exited = new Promise<string>((resolve, reject) => {
    cp.on('close', async (code: number) => {
      const out = getStdout()
      const err = getStderr()
      if (out) console.log(out)
      if (err) console.error(err)

      return code == 0 ? resolve(out) : reject(new Error(err))
    })
    cp.on('error', (error) => {
      console.error(error)
      reject(error)
    })
  })

  return {
    exited,
    stop: () => {
      cp.kill()
      return exited
    },
  }
}

export function saveOut(stream: Readable) {
  const out: Buffer[] = []
  stream.on('data', (data: string) => out.push(Buffer.from(data)))
  return () => Buffer.concat(out).toString('utf-8')
}

export async function waitForEndpoint(
  endpoint: string,
  retries: number,
  timeout = 10000,
): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    console.info(
      `Trying to connect to ${endpoint} (attempt ${attempt}/${retries})...`,
    )
    try {
      const r = await fetch(endpoint)

      if (!r.ok) {
        throw new Error(`Endpoint not ready yet, status code is ${r.status}`)
      }

      return true
    } catch (e) {
      console.warn(
        `Failed to connect to endpoint: ${endpoint}, waiting ${timeout}ms...`,
        (e as any).message,
      )

      await new Promise((resolve) => setTimeout(resolve, timeout))
    }
  }

  throw new Error(
    `Failed to connect to endpoint: ${endpoint} (attempts: ${retries})`,
  )
}

function describeIf(
  condition: boolean,
): (name: string, fn: () => void) => void {
  return condition ? describe : describe.skip
}
