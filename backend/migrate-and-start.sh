#!/bin/sh
# migrate-and-start.sh
#
# Production entrypoint for Docker deployments.
#
# Runs pending database migrations BEFORE starting the server.
# - set -e: exits immediately if migration fails (container crashes)
# - exec: replaces shell process so Node receives OS signals (SIGTERM for graceful shutdown)

set -e

echo "[entrypoint] Running database migrations..."
node dist/database/migrate.js

echo "[entrypoint] Migrations complete. Starting server..."
exec node dist/src/server.js
