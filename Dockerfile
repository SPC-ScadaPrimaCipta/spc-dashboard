FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
RUN npx prisma generate

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

EXPOSE 3002
CMD ["npm", "run", "start"]
