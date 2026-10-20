# syntax=docker/dockerfile:1

# ---- Build: install, verify (lint, format, types, tests) and bundle ----
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# A failing check fails the image build.
RUN npm run check && npm run build

# ---- Runtime: static files + API proxy ----
FROM nginx:1.30-alpine AS runtime

# Keys are optional at runtime; an unset key just disables that source.
ENV GUARDIAN_API_KEY="" \
    NYT_API_KEY="" \
    NEWSAPI_API_KEY=""

COPY docker/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY docker/nginx/upstream-proxy.conf /etc/nginx/snippets/upstream-proxy.conf
COPY --chmod=755 docker/40-sources-config.sh /docker-entrypoint.d/40-sources-config.sh
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
