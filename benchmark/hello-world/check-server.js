/* eslint-disable no-undef */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
require('@whatwg-node/fetch')
  .fetch(`http://localhost:4000/graphql?query=${encodeURIComponent('{ greetings }')}`)
  .then(res => res.json())
  .then(resJson => {
    if (resJson?.data?.greetings === 'This is the `greetings` field of the root `Query` type') {
      console.log('Case is working!', resJson)
    } else {
      console.log('Case is not working!', resJson)
      process.exit(1)
    }
  })
  .catch(e => {
    console.log('Unexpected error', e)
    process.exit(1)
  })
