## Getting Started

Run the development server with:

```sh
npm start
# or
yarn start
# or
pnpm start
```

Navigate to [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

The custom server implementation can be found in [`server.mjs`](server.mjs).

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Next.js custom server](https://nextjs.org/docs/advanced-features/custom-server) - allows you to start a server 100% programmatically in order to use custom server patterns

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## No deployment on Vercel

Since this NextJS project uses a [custom server](https://nextjs.org/docs/advanced-features/custom-server), it cannot be deployed to Vercel.
