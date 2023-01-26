FROM node:18
WORKDIR /web
COPY package.json schema.graphql tsconfig.json codegen.yaml ./
RUN npm install
COPY src ./src
RUN npm run build
EXPOSE 4001
USER node
CMD node dist/index.js
