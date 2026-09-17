#!/bin/sh
set -eu

npx prisma migrate deploy
if [ "${RUN_PRISMA_SEED:-false}" = "true" ]; then
  npm run prisma:seed
fi
exec npm run start
