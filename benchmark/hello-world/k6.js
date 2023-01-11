/* eslint-disable */
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js'
import { githubComment } from 'https://raw.githubusercontent.com/dotansimha/k6-github-pr-comment/master/lib.js'
import { check } from 'k6'
import http from 'k6/http'

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    no_errors: ['rate>0.99'],
    expected_result: ['rate>0.99'],
    http_req_duration: ['avg<=1'],
  },
}

export function handleSummary(data) {
  if (__ENV.GITHUB_TOKEN) {
    githubComment(data, {
      token: __ENV.GITHUB_TOKEN,
      commit: __ENV.GITHUB_SHA,
      pr: __ENV.GITHUB_PR,
      org: 'dotansimha',
      repo: 'graphql-yoga',
      renderTitle({ passes }) {
        return passes ? '✅ Benchmark Results' : '❌ Benchmark Failed'
      },
      renderMessage({ passes, checks, thresholds }) {
        const result = []

        if (thresholds.failures) {
          result.push(
            `**Performance regression detected**: it seems like your Pull Request adds some extra latency to GraphQL Yoga`,
          )
        }

        if (checks.failures) {
          result.push('**Failed assertions detected**')
        }

        if (!passes) {
          result.push(
            `> If the performance regression is expected, please increase the failing threshold.`,
          )
        }

        return result.join('\n')
      },
    })
  }
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  }
}

export default function () {
  const res = http.get(`http://localhost:4000/graphql?query=${encodeURIComponent('{ greetings }')}`)

  check(res, {
    no_errors: resp => !('errors' in resp.json()),
    expected_result: resp =>
      resp.json().data &&
      resp.json().data.greetings === 'This is the `greetings` field of the root `Query` type',
  })
}
