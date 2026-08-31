# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# ---- runtime ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4001
ENV SERVICE_NAME=processing-service

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./

EXPOSE 4001

# Runtime secrets (BACKEND_URL, INTERNAL_SECRET, S3_*) injected at deploy time.
CMD ["node", "--import", "./dist/instrumentation.js", "dist/index.js"]
