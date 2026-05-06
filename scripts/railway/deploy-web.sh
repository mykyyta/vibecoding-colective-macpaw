#!/usr/bin/env bash
# Deploy the Express API service to Railway.

set -euo pipefail

SERVICE="${RAILWAY_SERVICE:-vibecoding-colective-macpaw}"
RAILWAY_ENVIRONMENT="${RAILWAY_ENVIRONMENT:-}"

command -v railway >/dev/null 2>&1 || {
  echo "Error: required command not found: railway" >&2
  exit 1
}

if [[ -n "$RAILWAY_ENVIRONMENT" ]]; then
  railway up --service "$SERVICE" --environment "$RAILWAY_ENVIRONMENT"
else
  railway up --service "$SERVICE"
fi
