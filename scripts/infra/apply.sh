#!/usr/bin/env bash
# Apply Terraform changes for the single cloud environment.

set -euo pipefail

AWS_PROFILE="${AWS_PROFILE:-thehrdwood}"

AWS_PROFILE="$AWS_PROFILE" terraform -chdir=infra init
AWS_PROFILE="$AWS_PROFILE" terraform -chdir=infra apply -auto-approve -var-file="app.tfvars"
