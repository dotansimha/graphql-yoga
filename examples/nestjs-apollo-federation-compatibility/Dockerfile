FROM node:19
WORKDIR /app
COPY package.json package-lock.json schema.graphql tsconfig.json ./
RUN npm i --force
COPY src ./src
RUN npm run build
