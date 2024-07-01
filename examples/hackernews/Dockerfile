FROM node:22-slim

RUN apt-get update && apt-get install -y ca-certificates

WORKDIR /usr/src/app

COPY ./package.json /usr/src/app
COPY ./node_modules /usr/src/app/node_modules

COPY ./dist/src/ /usr/src/app/

LABEL org.opencontainers.image.title="Hackernews GraphQL Server"
LABEL org.opencontainers.image.version=$RELEASE
LABEL org.opencontainers.image.description="A Hackernews clone built with GraphQL and graphql-yoga."
LABEL org.opencontainers.image.authors="The Guild"
LABEL org.opencontainers.image.vendor="Laurin Quast"
LABEL org.opencontainers.image.url="https://github.com/dotansimha/graphql-yoga/tree/main/examples/hackernews"
LABEL org.opencontainers.image.source="https://github.com/dotansimha/graphql-yoga/tree/main/examples/hackernews"

ENV ENVIRONMENT production
ENV RELEASE $RELEASE

ENTRYPOINT ["node", "main.js"]
