# ==============================================================================
# SAHAAY Full-Stack Production Container (Hardened & Multi-Stage)
# ==============================================================================

# Stage 1: Build Dependencies and Compile TypeScript
FROM node:22-alpine AS builder

WORKDIR /app

# Install build-time OS dependencies for native binaries & Prisma
RUN apk add --no-cache openssl libc6-compat

# Copy dependency manifests
COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json ./server/
COPY client/package.json client/package-lock.json ./client/
COPY prisma ./prisma

# Install all dependencies and generate Prisma Client
RUN npm ci
RUN npm --prefix server ci
RUN npm --prefix client ci
RUN npx prisma generate

# Copy source files
COPY server/tsconfig.json ./server/
COPY server/src ./server/src
COPY client/tsconfig.json client/vite.config.ts client/tailwind.config.js client/postcss.config.js client/index.html ./client/
COPY client/public ./client/public
COPY client/src ./client/src
COPY client/scripts ./client/scripts

# Build server and client bundles
RUN npm run build:server
RUN npm run build:client

# Prune dev dependencies for production runtime
RUN npm prune --omit=dev
RUN npm --prefix server prune --omit=dev

# ==============================================================================
# Stage 2: Minimal Production Runtime
# ==============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

# Install runtime OpenSSL and tini init process for signal handling on Alpine
RUN apk add --no-cache openssl tini libc6-compat

ENV NODE_ENV=production
ENV PORT=5000

# Create application directories and configure non-root user permissions
RUN mkdir -p /app/storage/documents /app/prisma && \
    chown -R node:node /app

# Copy production artifacts from builder stage
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/server/node_modules ./server/node_modules
COPY --from=builder --chown=node:node /app/server/dist ./server/dist
COPY --from=builder --chown=node:node /app/client/dist ./client/dist
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/server/package.json ./server/package.json

# Switch to unprivileged node user
USER node

EXPOSE 5000

# Health check (checks liveness every 30s)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy && node server/dist/index.js"]

