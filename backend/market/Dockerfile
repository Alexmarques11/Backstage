FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY market/ ./

EXPOSE 6000

CMD ["node", "server.js"]
