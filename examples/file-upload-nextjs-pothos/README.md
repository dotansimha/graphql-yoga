## File upload example with Next.js and Pothos

This examples highlights how to do file upload with `Next.js` and `Pothos`. You can try it out
running:

```bash
curl localhost:3000/api/graphql \
  -F operations='{ "query": "mutation ($file: Upload!) { readTextFile(file: $file) }", "variables": { "file": null } }' \
  -F map='{ "0": ["variables.file"] }' \
  -F 0=@test.txt
```
