# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache make sqlite python3 make g++

COPY package*.json ./
COPY .papi ./.papi

RUN npm ci

COPY . .

RUN mkdir -p src/static
RUN mkdir -p dist/static

RUN npm run build
RUN cp -r src/static/* dist/static/ || true

FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache sqlite

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.papi ./.papi

RUN npm ci --production && npm install pm2 -g

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Set environment variable for database path
ENV VOS_DATA_PATH=/app/data

EXPOSE 3000

# Define volume for persistent data
VOLUME ["/app/data"]

CMD ["pm2-runtime", "dist/main.js"] 