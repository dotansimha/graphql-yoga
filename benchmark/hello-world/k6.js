import { check } from 'k6'
import http from 'k6/http'

export const options = {
  vus: 1,
  duration: '10s',
  thresholds: {
    no_errors: ['rate=1.0'],
    expected_result: ['rate=1.0'],
  },
}

export default function () {
  const res = http.get(
    `http://localhost:4000/graphql?query=${encodeURIComponent('{ hello }')}`,
  )

  check(res, {
    no_errors: (resp) => !('errors' in resp.json()),
    expected_result: (resp) =>
      resp.json().data && resp.json().data.hello === 'Hello World',
  })
}
