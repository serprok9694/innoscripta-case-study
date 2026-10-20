#!/bin/sh
# Runs from /docker-entrypoint.d before nginx starts. Never prints the keys.
# - /api/config: which news sources have an API key configured;
# - resolver.conf: the container's DNS servers, so nginx resolves the API
#   hosts per request instead of failing to start without network.
set -eu

has_key() {
  value=$(printenv "$1" || true)
  if [ -n "$(printf '%s' "$value" | tr -d '[:space:]')" ]; then echo true; else echo false; fi
}

mkdir -p /etc/nginx/runtime
printf '{"sources":{"guardian":%s,"nyt":%s,"newsapi":%s}}\n' \
  "$(has_key GUARDIAN_API_KEY)" "$(has_key NYT_API_KEY)" "$(has_key NEWSAPI_API_KEY)" \
  > /etc/nginx/runtime/sources-config.json

nameservers=$(awk '/^nameserver/ { ns = $2; if (ns ~ /:/) ns = "[" ns "]"; printf "%s ", ns }' /etc/resolv.conf)
echo "resolver ${nameservers:-1.1.1.1} valid=30s ipv6=off;" > /etc/nginx/runtime/resolver.conf

echo "sources-config: $(cat /etc/nginx/runtime/sources-config.json)"
