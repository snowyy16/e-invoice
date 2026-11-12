# ==========================================
# STAGE 1: Builder
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@12.18.0 --activate

# Install dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source code and build BFF
COPY . .
RUN pnpm nx build bff

# ==========================================
# STAGE 2: Production Runner
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Enable pnpm in runner stage
RUN corepack enable && corepack prepare pnpm@12.18.0 --activate

# Copy compiled output from builder
COPY --from=builder /app/dist/apps/be/bff ./

# Install production dependencies and PostgreSQL driver
RUN pnpm install --prod && pnpm add pg

# Run as non-root user (DevSecOps Security Standard)
USER node

EXPOSE 3000

CMD ["node", "main.js"]
