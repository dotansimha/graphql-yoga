import { defaultYogaLogger } from '../src/logger'
import { createServer } from '../src/server'

describe('Logging', () => {
  it('Yoga respects custom logger implementations', async () => {
    const logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }
    const yogaApp = createServer({
      logging: logger,
    })

    await yogaApp.inject({
      document: /* GraphQL */ `
        {
          greetings
        }
      `,
    })
    expect(logger.debug).toHaveBeenCalledWith(
      `Parsing request to extract GraphQL parameters`,
    )
  })
  describe('Default Logger', () => {
    it(`doesn't print debug messages if DEBUG env var isn't set`, () => {
      jest.spyOn(console, 'debug')
      defaultYogaLogger.debug('TEST')
      expect(console.debug).not.toHaveBeenCalledWith(
        expect.stringContaining('TEST'),
      )
    })
    it(`prints debug messages if DEBUG env var is set`, () => {
      process.env.DEBUG = '1'
      jest.spyOn(console, 'debug').mockImplementationOnce(() => {})
      defaultYogaLogger.debug('TEST')
      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining('TEST'),
      )
    })
  })
})
