FROM node:23

WORKDIR /usr/src/app

COPY package.json ./

RUN npm install

COPY src src

ENTRYPOINT npm run start
