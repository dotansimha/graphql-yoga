import { filter } from './filter.js'

async function collectAsyncIterableValues<TType>(
  asyncIterable: AsyncIterable<TType>,
): Promise<Array<TType>> {
  const values: Array<TType> = []
  for await (const value of asyncIterable) {
    values.push(value)
  }
  return values
}

describe('filter', () => {
  it('filters source stream', async () => {
    // eslint-disable-next-line @typescript-eslint/require-await
    async function* source() {
      yield 1
      yield 2
      yield 3
      yield 1
    }

    const filterFn = (value: number) => value < 3
    const stream = filter(filterFn)(source())
    const result = await collectAsyncIterableValues(stream)

    expect(result).toEqual([1, 2, 1])
  })
})
