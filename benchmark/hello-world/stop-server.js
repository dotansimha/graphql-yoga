require('cross-undici-fetch')
  .fetch(`http://localhost:4000/graphql`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      query: `mutation { stop }`,
    }),
  })
  .then((res) => res.text())
  .then((resText) => console.log(resText))
