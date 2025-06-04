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

# Prune dev dependencies
RUN pnpm --filter backend --prod prune

# Production stage
FROM node:20-alpine AS production

RUN apk add --no-cache openssl openssl-dev
WORKDIR /app

# Copy built application
COPY --from=builder /app/src/backend/dist ./dist
COPY --from=builder /app/src/backend/node_modules ./node_modules
COPY --from=builder /app/src/backend/package.json ./package.json

# Copy Prisma client if generated
COPY --from=builder /app/src/backend/prisma ./prisma

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/main.js"]
