FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY appkit/package*.json ./
COPY appkit/prisma ./prisma/
RUN npm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY appkit/ .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy package.json and install production dependencies
# Copy package.json and install production dependencies
COPY --from=deps /app/package.json /app/package-lock.json ./
COPY --from=deps /app/prisma ./prisma/
RUN ls -R prisma && npm ci --omit=dev

# Copy built artifacts
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

# Copy Prisma client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Create logs directory with correct permissions
RUN mkdir -p logs && chown nextjs:nodejs logs

USER nextjs

EXPOSE 3001

ENV PORT 3001

CMD ["node", "dist/server.js"]
