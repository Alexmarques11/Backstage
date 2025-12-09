FROM node:18-alpine

WORKDIR /app

COPY market/package*.json ./

RUN npm ci --only=production

COPY market/ ./

EXPOSE 6000

CMD ["node", "server.js"]
