#!/usr/bin/env bash
# Build the Vite app, upload it to the Terraform-managed S3 bucket, and
# invalidate CloudFront. This assumes Terraform has already been applied.

set -euo pipefail

AWS_PROFILE="${AWS_PROFILE:-thehrdwood}"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Error: required command not found: $1" >&2
    exit 1
  }
}

require_cmd aws
require_cmd npm
require_cmd terraform

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

cd "$ROOT_DIR"

npm run build

BUCKET="$(terraform -chdir=infra output -raw frontend_bucket_name)"
DISTRIBUTION_ID="$(terraform -chdir=infra output -raw cloudfront_distribution_id)"

aws --profile "$AWS_PROFILE" s3 sync dist "s3://${BUCKET}" \
  --delete \
  --exclude "index.html" \
  --exclude "server/*" \
  --exclude "shared/*" \
  --cache-control "public,max-age=31536000,immutable"

aws --profile "$AWS_PROFILE" s3 cp dist/index.html "s3://${BUCKET}/index.html" \
  --cache-control "no-cache,no-store,must-revalidate" \
  --content-type "text/html"

aws --profile "$AWS_PROFILE" cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*"
