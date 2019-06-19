# file-upload

This directory contains an example of a graphql-yoga server supporting file uploads.

## Get started

**Clone the repository:**

```sh
git clone https://github.com/graphcool/graphql-yoga.git
cd graphql-yoga/examples/file-upload
```

**Install dependencies and run the app:**

```sh
yarn install # or npm install
yarn start   # or npm start
```

## Using the file-upload api

The graphql-yoga server uses [graphql-upload](https://github.com/jaydenseric/graphql-upload) to handle file uploads. It expects files to be uploaded through a specific [GraphQL multi-part request](https://github.com/jaydenseric/graphql-multipart-request-spec). The simplest way to correctly handle the outgoing request is to use [apollo-upload-client](https://github.com/jaydenseric/apollo-upload-client). See [apollo-upload-examples](https://github.com/jaydenseric/apollo-upload-examples) for a react client uploading to apollo-upload-server similar in function to the one here.
