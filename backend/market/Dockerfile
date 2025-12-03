FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . ./

EXPOSE 6000

CMD ["node", "marketServer.js"]
