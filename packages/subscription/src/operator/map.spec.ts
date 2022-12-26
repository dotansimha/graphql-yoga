import { map } from './map.js'

async function collectAsyncIterableValues<TType>(
  asyncIterable: AsyncIterable<TType>,
): Promise<Array<TType>> {
  const values: Array<TType> = []
  for await (const value of asyncIterable) {
    values.push(value)
  }
  return values
}

describe('map', () => {
  it('maps source stream', async () => {
    // eslint-disable-next-line @typescript-eslint/require-await
    async function* source() {
      yield 1
      yield 2
      yield 3
      yield 1
    }

    const filterFn = (value: number) => value * 2
    const stream = map(filterFn)(source())
    const result = await collectAsyncIterableValues(stream)

    expect(result).toEqual([2, 4, 6, 2])
  })
})
