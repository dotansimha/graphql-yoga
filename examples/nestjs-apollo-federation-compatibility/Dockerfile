FROM node:18
WORKDIR /web
COPY package.json schema.graphql tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm install
RUN npm run build
EXPOSE 4001
USER node
CMD node dist/main
