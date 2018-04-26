# interface and unions

This directory contains a simple GraphQL server implementing interfaces and unions based on `graphql-yoga`.

If you want to setup `graphql-yoga` to consume interfaces or unions from `Prisma`, you can check [this post](https://medium.com/@tibotiber/graphql-interfaces-and-union-types-with-prisma-and-yoga-7224f9e1d9ad) which describes how to workaround interfaces and unions in Prisma and map them back to the expected schema in `graphql-yoga`.

## Get started

**Clone the repository:**

```sh
git clone https://github.com/graphcool/graphql-yoga.git
cd graphql-yoga/examples/interface-union
```

**Install dependencies and run the app:**

```sh
yarn install # or npm install
yarn start   # or npm start
```

## Testing

Open your browser at [http://localhost:4000](http://localhost:4000) and start sending queries.

**Interface Query:**

```graphql
{
  character{
    name
    ...on Human{
      starships{
        name
      }
    }
    ...on Droid{
      primaryFunction
    }
  }
}
```

The server returns the following response:

```json
{
  "data": {
    "character": {
      "name": "Han Solo",
      "starships": [
        {
          "name": "Millennium Falcon"
        }
      ]
    }
  }
}
```

**Union Query:**

```graphql
{
  humanOrDroid{
    ...on Human{
    	name	
      starships{
        name
      }
    }
    ...on Droid{
    	name
      primaryFunction
    }
  }
}
```

The server returns the following response:

```json
{
  "data": {
    "humanOrDroid": {
      "name": "R2-D2",
      "primaryFunction": "Astromech"
    }
  }
}
```
