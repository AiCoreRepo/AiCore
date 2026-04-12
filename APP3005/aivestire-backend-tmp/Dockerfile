# --- Stage 1: Builder ---
FROM node:20-bullseye-slim AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci --no-audit --fund=false

COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

ENV DATABASE_URL="postgresql://placeholder:placeholder@placeholder:5432/placeholder"
RUN npm run build

# --- Stage 2: Production ---
FROM node:20-bullseye-slim AS production

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
COPY scripts ./scripts
COPY --from=builder /app/node_modules ./node_modules

RUN npm prune --omit=dev \
    && npx prisma generate \
    && npm cache clean --force

COPY --from=builder /app/dist ./dist
EXPOSE 3000

CMD ["node", "dist/src/main.js"]
