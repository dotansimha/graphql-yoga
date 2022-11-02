import { jest } from '@jest/globals'
import { createYoga, defaultYogaLogger } from '../src'

describe('logging', () => {
  it('use custom logger', async () => {
    const logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }
    const yogaApp = createYoga({
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
  describe('default logger', () => {
    it(`doesn't print debug messages if DEBUG env var isn't set`, () => {
      jest.spyOn(console, 'debug')
      defaultYogaLogger.debug('TEST')
      // eslint-disable-next-line no-console
      expect(console.debug).not.toHaveBeenCalled()
    })
    it(`prints debug messages if DEBUG env var is set`, () => {
      const originalValue = process.env.DEBUG
      try {
        process.env.DEBUG = '1'
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        jest.spyOn(console, 'debug').mockImplementationOnce(() => {})
        defaultYogaLogger.debug('TEST')
        // eslint-disable-next-line no-console
        expect(console.debug).toHaveBeenCalled()
      } finally {
        process.env.DEBUG = originalValue
      }
    })
  })
})
