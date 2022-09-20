import { spawn } from 'child_process'
import puppeteer from 'puppeteer'

let browser: puppeteer.Browser
let page: puppeteer.Page
let bunProcess: ReturnType<typeof spawn>

const timings = {
  waitForSelector: 999,
  waitForResponse: 1999,
}

jest.setTimeout(20000)

describe('Bun integration', () => {
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

    // Launch puppeteer
    browser = await puppeteer.launch({
      // If you wanna run tests with open browser
      // set your PUPPETEER_HEADLESS env to "false"
      headless: process.env.PUPPETEER_HEADLESS !== 'false',
      args: ['--incognito'],
    })
  })

  beforeEach(async () => {
    if (page !== undefined) {
      await page.close()
    }
    const context = await browser.createIncognitoBrowserContext()
    page = await context.newPage()
  })

  afterAll(async () => {
    await browser.close()
    bunProcess.kill()
  })

  it('go to GraphiQL page', async () => {
    // Go the the right route
    const body = await page.goto(
      `${serverUrl}?query=query+Hello+%7B%0A%09greetings%0A%7D`,
    )

    let strIntro = ''
    try {
      // A-1/ Wait for the introspection query result getting our type "greetings"
      const resIntro = await page.waitForResponse(
        (res) => res.url().endsWith('/graphql'),
        {
          timeout: timings.waitForResponse,
        },
      )
      const jsonIntro = await resIntro.json()
      strIntro = JSON.stringify(jsonIntro, null, 0)
    } catch (error) {
      // We had an issue grabbing the introspection query result!
      // let's see what is in the html with the finafinally
    } finally {
      const bodyContent = await body?.text()
      // B/ Check that GraphiQL is showing
      expect(bodyContent).toContain(`Yoga GraphiQL`)
    }

    // A-2/ Finish the test after the body check
    expect(strIntro).toContain(`"name":"greetings"`)

    // C/ Tigger the default request and wait for the response
    const [res] = await Promise.all([
      page.waitForResponse((res) => res.url().endsWith('/graphql'), {
        timeout: timings.waitForResponse,
      }),
      page.click(`button[class="execute-button"]`),
    ])

    const json = await res.json()
    const str = JSON.stringify(json, null, 0)
    expect(str).toContain(`{"data":{"greetings":"Hello Bun!"}}`)
  })
})
