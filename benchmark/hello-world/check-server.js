require('cross-undici-fetch')
  .fetch(
    `http://localhost:4000/graphql?query=${encodeURIComponent('{ hello }')}`,
  )
  .then((res) => res.json())
  .then((resJson) => {
    if (resJson?.data?.hello === 'Hello World') {
      console.log('Case is working!', resJson)
    } else {
      console.log('Case is not working!', resJson)
      process.exit(1)
    }
  })
  .catch((e) => {
    console.log('Unexpected error', e)
    process.exit(1)
  })
