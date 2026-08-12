# ============================================================
# Stage 1 — Builder
# ============================================================

FROM node:24-alpine AS builder

# Create application directory
WORKDIR /app

# Enable pnpm through Corepack
RUN corepack enable

# Copy dependency manifests first for better Docker layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install all dependencies (including devDependencies)
RUN pnpm install --frozen-lockfile

# Copy application source
COPY . .

# Build TypeScript
RUN pnpm build

# ============================================================
# Stage 2 — Production
# ============================================================

FROM node:24-alpine AS production

# Image metadata
LABEL maintainer="m-aaron" \
    description="Multi-Tenant SaaS HR Platform Backend API" \
    version="1.0.0"

# Create application directory
WORKDIR /app

# Production environment
ENV NODE_ENV=production

# Enable pnpm
RUN corepack enable

# Copy dependency manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Add wget for health check and install only production dependencies
RUN pnpm install --prod --frozen-lockfile \
    &&  apk add --no-cache wget

# Copy compiled application from builder stage
COPY --from=builder /app/dist ./dist

# Document the application port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s \
            --timeout=5s \
            --start-period=10s \
            --retries=3 \
    CMD wget -q --spider http://localhost:${PORT:-4000}/api/v1/health || exit 1

# Graceful shutdown signal
STOPSIGNAL SIGTERM

# Use non-root user for better security
USER node

# Start the backend server
CMD ["node", "dist/server.js"]