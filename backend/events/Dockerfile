FROM node:18-alpine

WORKDIR /app

COPY events/package*.json ./

RUN npm ci --only=production

COPY events/ ./

EXPOSE 7000

CMD ["node", "concertsServer.js"]
