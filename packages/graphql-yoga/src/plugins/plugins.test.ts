import { AfterValidateHook } from '@envelop/core'
import { GraphQLError } from 'graphql'
import { Plugin } from '../src/plugins/types'
import { createServer } from '../src/server'

describe('Yoga Plugins', () => {
  it(`should respect Envelop's OnPluginInit's addPlugin`, async () => {
    const afterValidateHook: AfterValidateHook<any> = jest
      .fn()
      .mockImplementation(({ setResult }) => {
        setResult([new GraphQLError('My Error')])
      })
    const testPlugin: Plugin = {
      onValidate() {
        return afterValidateHook
      },
    }
    const testPluginToAdd: Plugin = {
      onPluginInit({ addPlugin }) {
        addPlugin(testPlugin)
      },
    }
    const yoga = createServer({
      plugins: [testPluginToAdd],
    })
    const response = await yoga.fetch('http://localhost:3000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '{hello}',
      }),
    })
    const result = await response.json()
    expect(result).toEqual({
      data: null,
      errors: [
        {
          message: 'My Error',
          extensions: {},
        },
      ],
    })
  })
})
