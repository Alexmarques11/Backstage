FROM node:18-alpine

WORKDIR /app

COPY passport/package*.json ./

RUN npm ci --only=production

COPY passport/ ./

EXPOSE 5000

CMD ["node", "server.js"]
