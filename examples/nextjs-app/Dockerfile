from node:20-alpine

COPY ./package.json .
RUN npm install

COPY . .

RUN npm run build

EXPOSE 80
CMD PORT=80 npm run start
