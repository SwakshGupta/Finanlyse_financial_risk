# ==============================================================================
# Finalyse Backend API - Production Dockerfile
# Node.js 20 on Alpine Linux (Non-root, Minimal attack surface)
# ==============================================================================

FROM node:20-alpine AS builder

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ==============================================================================
# Runner Stage
# ==============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=4000

# Copy node_modules and code
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY src/ ./src/

# Ensure non-root user execution
USER node

EXPOSE 4000

# Container health probe
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["node", "src/server.js"]
