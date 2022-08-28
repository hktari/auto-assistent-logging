#!/usr/bin/env sh
set -eu

echo 'ENVSUBST'

envsubst '${API_HOST} ${API_PORT} ${DOMAIN}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

cat /etc/nginx/conf.d/default.conf

exec "$@"