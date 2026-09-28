# ==============================================================================
# SAHAAY Backend Server Container (Hardened & Multi-Stage)
# ==============================================================================

# Stage 1: Build & Compile
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies for Prisma and native extensions
RUN apk add --no-cache openssl libc6-compat

# Copy dependency specifications
COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json ./server/
COPY prisma ./prisma

# Install dependencies and generate Prisma Client
RUN npm ci
RUN npm --prefix server ci
RUN npx prisma generate

# Copy server source code and compile TypeScript
COPY server/tsconfig.json ./server/
COPY server/src ./server/src
RUN npm run build:server

# Prune dev dependencies
RUN npm prune --omit=dev
RUN npm --prefix server prune --omit=dev

# ==============================================================================
# Stage 2: Production Runtime
# ==============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

# Install runtime OpenSSL for Prisma engine on Alpine
RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV PORT=5000

# Create directories and assign ownership to non-root node user
RUN mkdir -p /app/storage/documents /app/prisma && \
    chown -R node:node /app

# Copy production artifacts with non-root ownership
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/server/node_modules ./server/node_modules
COPY --from=builder --chown=node:node /app/server/dist ./server/dist
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/server/package.json ./server/package.json

# Switch to non-root user
USER node

EXPOSE 5000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "server/dist/index.js"]
