# ── Stage 1: Builder ──────────────────────────────────────────
# Install all deps and compile TypeScript

FROM node:20-alpine AS builder


WORKDIR /app  


# Copy package files first — Docker caches this layer
# So npm install only reruns when package.json changes
COPY package*.json ./
RUN npm ci

# Copy source code and compile
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────
# Lean final image — only production deps + compiled JS
FROM node:20-alpine AS production

WORKDIR /app

# copy package files
COPY package*.json ./

# Install only production dependencies — no devDependencies
# RUN npm ci --only=production
RUN npm ci --omit=dev

# Copy compiled output from builder stage
COPY --from=builder /app/dist ./dist

# Copy drizzle migrations — needed at runtime for db:migrate
COPY src/db/migrations ./src/db/migrations
# COPY drizzle.config.ts ./

# Non-root user for security — never run as root in production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 5000


# Start the compiled app
CMD ["sh", "-c", "node dist/scripts/migrate.js && node dist/server.js"]