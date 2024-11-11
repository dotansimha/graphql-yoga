FROM node:22-slim

WORKDIR /usr/src/app

COPY package.json ./

RUN npm install

COPY src src

ENTRYPOINT npm run start
