## Express-Session Example

### Note:

This would not work directly via PlayGround, because of fetch options. I've created an [issue](https://github.com/graphcool/graphql-yoga/issues/255) for the same.

### Usage?:

1. Specify your frontend's origin URL in the cors options of the server.
2. In your frontend Fetch / Apollo options, set [credentials: include](https://www.apollographql.com/docs/react/recipes/authentication.html)
3. Now your frontend would be able to send cookies to the GraphQL Server. Happy Authenticating!
