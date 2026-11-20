#!/bin/sh
set -eu

# Database migrations and seed are intentionally separate, explicitly approved
# maintenance operations. A normal application start must never mutate the DB.
exec npm run start
