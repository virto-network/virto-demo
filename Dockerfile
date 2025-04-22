# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache make

COPY package*.json ./

RUN npm ci

COPY . .

RUN mkdir -p src/static
RUN mkdir -p dist/static

# Make example.html accessible from root path
RUN cp src/static/example.html src/static/index.html 

RUN npm run build
RUN cp -r src/static/* dist/static/ || true

FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

RUN npm ci --production && npm install pm2 -g

EXPOSE 3000 9909-9950

CMD ["pm2-runtime", "dist/main.js"] 