# Run this from the root of the project:
# docker build -f apps/web/Dockerfile .

FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app

# Copy monorepo contents
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build Next.js
# This will generate the .next/standalone folder based on the next.config.js
RUN pnpm turbo run build --filter=web

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# The Next.js standalone build handles copying its own needed dependencies
# We just need to copy the standalone folder and the static assets
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3456
ENV PORT=3456
ENV HOSTNAME="0.0.0.0"

# Note: In a turborepo standalone build, the server.js will be nested inside the app directory
CMD ["node", "apps/web/server.js"]
