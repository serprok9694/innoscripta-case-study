# syntax=docker/dockerfile:1

# ---- Dependencies ----
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---- Build: type check and bundle ----
FROM deps AS build
COPY . .
RUN npm run build

# ---- Verify (opt-in): lint, formatting and tests ----
# Kept out of the runtime image's path so a slow or flaky machine can't stop
# anyone from running the app. CI runs it; locally: docker build --target verify .
FROM build AS verify
RUN npm run lint && npm run format:check && npm test

# ---- Runtime: static files + API proxy (default target) ----
FROM nginx:1.30-alpine AS runtime

# Keys are optional at runtime; an unset key just disables that source.
ENV GUARDIAN_API_KEY="" \
    NYT_API_KEY="" \
    NEWSAPI_API_KEY=""

COPY docker/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY docker/nginx/upstream-proxy.conf docker/nginx/security-headers.conf /etc/nginx/snippets/
COPY --chmod=755 docker/40-sources-config.sh /docker-entrypoint.d/40-sources-config.sh
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
