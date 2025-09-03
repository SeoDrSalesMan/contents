# syntax=docker/dockerfile:1.6

# Base
FROM node:22-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache libc6-compat

# Deps (incluye devDependencies para compilar)
FROM base AS deps
WORKDIR /app
ENV NODE_ENV=development
COPY package.json package-lock.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm i --no-audit --no-fund; fi

# Build
FROM base AS builder
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner
FROM node:22-alpine AS runner
WORKDIR /app
RUN addgroup -S nodejs -g 1001 \
 && adduser -S nextjs -u 1001 -G nodejs \
 && apk add --no-cache curl

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# artefactos standalone
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

EXPOSE 3000

# healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/api/health" || exit 1

USER nextjs
CMD ["node", "server.js"]
