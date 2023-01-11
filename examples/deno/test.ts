import { assertEquals } from 'https://deno.land/std@0.158.0/testing/asserts.ts'

import { yoga } from './yoga.ts'

Deno.test('Deno example test', async () => {
  const response = await yoga.fetch('http://yoga/graphql?query={hello}', {})
  const { data } = await response.json()
  assertEquals(data.hello, 'Hello Deno!')
})
