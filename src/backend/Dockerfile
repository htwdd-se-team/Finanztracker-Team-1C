FROM node:20.18-alpine AS builder

RUN apk add --no-cache openssl openssl-dev

RUN npm install -g pnpm

WORKDIR /app

# Copy workspace configuration files from root
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all packages (since pnpm-workspace.yaml references 'src/*')
COPY src ./src

# Install dependencies for the entire workspace
RUN pnpm install --frozen-lockfile

# Generate Prisma client for backend
RUN pnpm --filter backend prisma:generate

# Build the backend application
RUN pnpm --filter backend build

# Production stage
FROM node:20-alpine AS production

RUN apk add --no-cache openssl openssl-dev
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace configuration files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy source files (needed for pnpm workspace)
COPY src/backend ./src/backend

# Install only production dependencies
RUN pnpm --filter backend install --prod --frozen-lockfile

# Copy built application from builder stage
COPY --from=builder /app/src/backend/dist ./src/backend/dist

# Copy Prisma client if generated
COPY --from=builder /app/src/backend/prisma ./src/backend/prisma

ENV NODE_ENV=production
EXPOSE 3000

WORKDIR /app/src/backend
CMD ["node", "dist/main.js"]
