# custom-directive

This directory contains a simple GraphQL with custom directives example based on `graphql-yoga`.

## Get started

**Clone the repository:**

```sh
git clone https://github.com/graphcool/graphql-yoga/
cd graphql-yoga/examples/custom-directives
```

**Install dependencies and run the app:**

```sh
yarn install # or npm install
yarn start   # or npm start
```

## Testing

Open your browser at [http://localhost:4000](http://localhost:4000) and start sending queries.

**Query `hello`:**

```graphql
query {
  hello
}
```

The server returns the following response:

```json
{
  "data": {
    "hello": "HELLO WORD"
  }
}
```

Note that the original `Hello Word` output from the resolver is now in upper case due to our custom `@upper` directive.

**Query `secret` (with role set as `admin`):**
```graphql
query {
  secret
}
```

The server returns the following response:

```json
{
  "data": {
    "secret": "This is very secret"
  }
}
```


**Query `secret` (with role set as `user`):**

Go to `index.js:45`, change `admin` by `user` and reload the server.

```graphql
query {
  secret
}
```

The server returns the following response:

```json
{
  "data": {
    "secret": null
  },
  "errors": [
    {
      "message": "You are not authorized. Expected roles: admin",
      "locations": [
        {
          "line": 1,
          "column": 2
        }
      ],
      "path": [
        "secret"
      ]
    }
  ]
}
```
