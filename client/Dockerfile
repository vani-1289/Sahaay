# ==============================================================================
# SAHAAY Frontend Web Client (Production Multi-Stage Nginx Container)
# ==============================================================================

# Stage 1: Build Static SPA Bundle
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency specifications
COPY package.json package-lock.json ./
COPY client/package.json client/package-lock.json ./client/

# Install client dependencies
RUN npm --prefix client ci

# Copy client source files
COPY client/tsconfig.json client/vite.config.ts client/tailwind.config.js client/postcss.config.js client/index.html ./client/
COPY client/public ./client/public
COPY client/src ./client/src
COPY client/scripts ./client/scripts

# Build production bundle
RUN npm --prefix client run build

# Stage 2: Production Web Server
FROM nginx:alpine AS runner

# Copy compiled SPA assets to Nginx web root
COPY --from=builder /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
