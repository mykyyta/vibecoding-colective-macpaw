#!/usr/bin/env bash
# Deploy the Express API service to Railway.

set -euo pipefail

SERVICE="${RAILWAY_SERVICE:-vibecoding-colective-macpaw}"
RAILWAY_ENVIRONMENT="${RAILWAY_ENVIRONMENT:-production}"
RAILWAY_PROJECT_ID="${RAILWAY_PROJECT_ID:-}"

command -v railway >/dev/null 2>&1 || {
  echo "Error: required command not found: railway" >&2
  exit 1
}

args=(--service "$SERVICE" --environment "$RAILWAY_ENVIRONMENT")

if [[ -n "$RAILWAY_PROJECT_ID" ]]; then
  args+=(--project "$RAILWAY_PROJECT_ID")
fi

if [[ "${CI:-}" == "true" ]]; then
  args+=(--ci)
fi

railway up "${args[@]}"
