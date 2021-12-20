require('undici').fetch(`http://localhost:4000/graphql`, {
  method: 'POST',
  body: JSON.stringify({
    query: `mutation { stop }`,
  }),
})
