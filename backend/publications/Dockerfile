FROM node:18-alpine

WORKDIR /app

COPY publications/package*.json ./

RUN npm ci --only=production

COPY publications/ ./

EXPOSE 3003

CMD ["node", "server.js"]
