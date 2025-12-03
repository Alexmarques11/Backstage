FROM node:18-alpine

WORKDIR /app

COPY notifications/package*.json ./

RUN npm install

COPY notifications/ ./

EXPOSE 3003

CMD ["node", "notificationServer.js"]
