FROM node:20.18-alpine

RUN apk add --no-cache openssl openssl-dev

RUN npm install -g pnpm

WORKDIR /app

# Copy workspace configuration files from root
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy backend and api-client packages (api-client is a workspace dependency)
COPY src/backend ./src/backend
COPY src/api-client ./src/api-client

# Install dependencies for the backend only
RUN pnpm --filter backend install --frozen-lockfile

# Generate Prisma client for backend
RUN pnpm --filter backend prisma:generate

# Build the backend application
RUN pnpm --filter backend build

ENV NODE_ENV=production
EXPOSE 3000

WORKDIR /app/src/backend
CMD ["node", "dist/main.js"]
