#!/bin/sh
set -eu

npx prisma migrate deploy
npm run prisma:seed
exec npm run start
