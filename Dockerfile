# syntax=docker/dockerfile:1.6

############################
# Base (Node 22 LTS)
############################
FROM node:22-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache libc6-compat

############################
# Deps (incluye devDependencies para compilar)
############################
FROM base AS deps
WORKDIR /app
# En build necesitamos devDeps (typescript, @types, etc.)
ENV NODE_ENV=development
COPY package.json package-lock.json ./
RUN if [ -f package-lock.json ]; then npm ci; else echo "Lockfile not found." && exit 1; fi

############################
# Build (genera artefactos standalone)
############################
FROM base AS builder
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

############################
# Runner (mínimo, no root, con curl para health)
############################
FROM node:22-alpine AS runner
WORKDIR /app

# Usuario no root y curl para healthcheck
RUN addgroup -S nodejs -g 1001 \
 && adduser -S nextjs -u 1001 -G nodejs \
 && apk add --no-cache curl

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Copiamos solo lo necesario del build standalone
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

EXPOSE 3000

# Healthcheck dentro de la imagen (requiere /api/health en tu app)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/api/health" || exit 1

USER nextjs
CMD ["node", "server.js"]
