# Run this from the root of the project:
# docker build -f apps/api/Dockerfile .

FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
RUN apk update && apk add --no-cache libc6-compat
# Set working directory
WORKDIR /app

# Copy source code and lockfile
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
RUN pnpm --filter @repo/api exec prisma generate

# Build the project (NestJS API)
RUN pnpm turbo run build --filter=@repo/api

# Deploy only the api app with its production dependencies to a separate folder
RUN pnpm deploy --filter @repo/api --prod /prod/api

# Create the final production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

# Copy the isolated production deployment of the API
COPY --from=builder --chown=nestjs:nodejs /prod/api ./

EXPOSE 3000

# Start the NestJS application
CMD ["node", "dist/main.js"]
