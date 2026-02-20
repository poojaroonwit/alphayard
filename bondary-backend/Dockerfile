FROM node:20-alpine

WORKDIR /app

COPY bondary-backend/package*.json ./
RUN npm install

COPY bondary-backend/ .

RUN npx prisma generate

RUN npm run build

EXPOSE 4000

CMD ["node", "dist/server.js"]
