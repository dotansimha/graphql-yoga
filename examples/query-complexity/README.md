# GraphQL Query Complexity / Cost analysis

This directory contains an example with query complexity analysis based on `graphql-yoga` and [`graphql-cost-analysis`](https://github.com/pa-bru/graphql-cost-analysis).

## Get started

**Clone the repository:**

```sh
git clone https://github.com/graphcool/graphql-yoga.git
cd graphql-yoga/examples/query-complexity
```

**Install dependencies and run the app:**

```sh
yarn install # or npm install
yarn start   # or npm start
```

## Testing

Open your browser at [http://localhost:4000](http://localhost:4000) and start sending queries.

### Simple query

```graphql
{
  posts(limit:1) {
    id
    title
  }
}
```

#### `200` Response

```json
{
  "data": {
    "posts": [
      {
        "id": 0,
        "title": "My first blog post"
      }
    ]
  }
}
```

### Too complex query

```graphql
{
  posts(limit:5) {
    id
    title
  }
}
```

#### `400` response:

```json
{
  "errors": [
    {
      "message": "The query exceeds the maximum cost of 50. Actual cost is 52"
    }
  ]
}
```

## Implementation

The query complexity is calculated with the help of the `@cost`-directive defined in [`index.js`](./index.js).

## Further reading


- [`graphql-cost-analysis` Documentation](https://github.com/pa-bru/graphql-cost-analysis)
- [How to GraphQL: Security and GraphQL Tutorial](https://www.howtographql.com/advanced/4-security/)
- [Apollo: Securing Your GraphQL API from Malicious Queries
](https://dev-blog.apollodata.com/securing-your-graphql-api-from-malicious-queries-16130a324a6b)