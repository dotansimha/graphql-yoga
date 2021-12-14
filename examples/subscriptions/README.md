# subscriptions

This directory contains a simple GraphQL subscriptions example based on `graphql-yoga`.

## Get started

**Clone the repository:**

```sh
git clone https://github.com/graphcool/graphql-yoga.git
cd graphql-yoga/examples/subscriptions
```

**Install dependencies and run the app:**

```sh
yarn install # or npm install
yarn start   # or npm start
```

## Testing

Open your browser at [http://localhost:4000](http://localhost:4000) and start a subscription.

Paste the following subscription in the editor (left side) of the Playground:

```graphql
subscription {
  counter
}
```

The counter will increment every two seconds and the corresponding data is received in the Playground:

```json
{
  "data": {
    "counter": 1,
  }
}
// ... 1 seconds
{
  "data": {
    "counter": 2,
  }
}
// ... 2 seconds
{
  "data": {
    "counter": 3,
  }
}
// ...
```
