#!/bin/sh
set -e

PORT="${PORT:-80}"

echo "================================================"
echo "Frontend Container Starting"
echo "PORT: $PORT"
echo "================================================"

sed "s|NGINX_PORT|${PORT}|g" \
    /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
