#!/bin/sh
# Writes /api/config: which news sources have an API key configured.
# Runs from /docker-entrypoint.d before nginx starts. Never prints the keys.
set -eu

has_key() {
  value=$(printenv "$1" || true)
  if [ -n "$(printf '%s' "$value" | tr -d '[:space:]')" ]; then echo true; else echo false; fi
}

mkdir -p /etc/nginx/runtime
printf '{"sources":{"guardian":%s,"nyt":%s,"newsapi":%s}}\n' \
  "$(has_key GUARDIAN_API_KEY)" "$(has_key NYT_API_KEY)" "$(has_key NEWSAPI_API_KEY)" \
  > /etc/nginx/runtime/sources-config.json

echo "sources-config: $(cat /etc/nginx/runtime/sources-config.json)"
