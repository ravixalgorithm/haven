# Base image using Debian-slim (better for native binaries like Prisma/OpenSSL)
FROM node:20-slim AS base

# Install OpenSSL (required for Prisma)
RUN apt-get update -y && apt-get install -y openssl

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* package-lock.json* ./
COPY packages/api/package.json ./packages/api/
# Install dependencies (using npm since lockfile is npm)
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma Client
WORKDIR /app/packages/api
RUN npx prisma generate
# Build the project
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built artifacts
COPY --from=builder /app/packages/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/api/package.json ./package.json
COPY --from=builder /app/packages/api/prisma ./prisma

# Add a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 listjs
USER listjs

EXPOSE 3002
ENV PORT=3002

CMD ["node", "dist/index.js"]
