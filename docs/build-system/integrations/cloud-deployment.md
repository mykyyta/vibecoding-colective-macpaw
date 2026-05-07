---
last_updated: 2026-05-07
owner: Architect
---

# Cloud Deployment

This project can deploy as a small CloudFront + Railway stack when the pet
project needs a stable public URL.

## Decision

- **Frontend edge entrypoint:** AWS S3 + CloudFront in the `thehrdwood` AWS
  account.
- **Backend runtime:** one Railway web service in the Pult Railway account.
- **Environment model:** one cloud environment only. Do not create separate
  staging and production stacks for this prototype.
- **Public request shape:** CloudFront is the browser-facing URL. It serves
  static Vite assets from S3 and routes `/api/*` plus `/health` to Railway.
- **Terraform state:** reuse the Pult Terraform state bucket with an isolated
  key: `vibecoding-colective/terraform.tfstate`.
- **AWS profile:** `thehrdwood` for all privileged AWS and Terraform commands.

## Why This Shape Is Sufficient

The current app is a Vite client plus one Express API. It does not need a
workers, queues, custom auth, or a separate API domain for the current product
shape. Add durable storage behind Express when a product feature needs it.
Routing API traffic through CloudFront keeps browser requests
same-origin and avoids adding CORS surface area.

## Runtime Boundary

```text
Browser
  -> CloudFront
      -> S3 frontend origin for /* static assets
      -> Railway origin for /api/* and /health
          -> Express server
              -> Claude, Gemini, ElevenLabs provider APIs, and storage adapters
```

Secrets stay in Railway service variables. The built frontend must not contain
provider API keys or AWS credentials.

## Local Files

- `railway.toml` defines the Railway build and start command.
- `infra/` defines the S3 bucket, CloudFront distribution, S3 origin access
  control, API origin routing, and outputs.
- `scripts/infra/plan.sh` runs a Terraform plan.
- `scripts/infra/apply.sh` applies the reviewed Terraform plan.
- `scripts/railway/deploy-web.sh` deploys the web service.
- `scripts/cloudfront/deploy-frontend.sh` builds, uploads to S3,
  and invalidates CloudFront after Terraform has been applied.

## Required Manual Inputs

Before applying Terraform, replace the placeholder Railway domain in
`infra/app.tfvars`. The value must be a Railway public domain without
`https://`.

Current value:

```text
vibecoding-colective-macpaw-production.up.railway.app
```

Before deploying Railway, set service variables for any providers or storage
adapters used by the product:

- `CLAUDE_API_KEY`
- `CLAUDE_MODEL`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_STT_MODEL`
- `ELEVENLABS_TTS_MODEL`
- `ELEVENLABS_DEFAULT_VOICE_ID`
- `ELEVENLABS_GUARD_VOICE_ID`
- `ELEVENLABS_PIXEL_VOICE_ID`
- `ELEVENLABS_ROOM_VOICE_ID`
- `DEMO_API_TOKEN` if paid routes are exposed beyond the demo team
- `LEADERBOARD_TABLE_NAME` and `LEADERBOARD_COMPLETION_TOKEN_SECRET` when
  persistent leaderboard storage is enabled
- AWS credential variables for Railway when it writes to DynamoDB
  (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and optionally `AWS_REGION`;
  region defaults to `eu-central-1`)

## Command Order

Run only after confirming that external resource creation is approved:

```bash
npm run deploy:railway
```

Create or copy the Railway public domain into `infra/app.tfvars`, then plan:

```bash
AWS_PROFILE=thehrdwood npm run infra:plan
```

After reviewing the plan, apply Terraform, then deploy the frontend:

```bash
AWS_PROFILE=thehrdwood npm run infra:apply
```

```bash
AWS_PROFILE=thehrdwood npm run deploy:cloudfront
```

## GitHub Actions

Pushes to `main` run `.github/workflows/deploy-main.yml`.

The workflow:

1. installs dependencies;
2. typechecks;
3. deploys Railway service `vibecoding-colective-macpaw`;
4. waits for the Railway deployment to reach `SUCCESS`;
5. builds and uploads frontend assets to S3;
6. creates a CloudFront invalidation;
7. smoke-tests `/`, `/health`, and `/api/status` through CloudFront.

Required GitHub repository secrets:

- `RAILWAY_TOKEN`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

The workflow intentionally uses the existing single environment and does not
create or mutate Terraform-managed infrastructure.

## Risks And Mitigations

- **Paid resources:** Railway service, S3, CloudFront, and DynamoDB can incur
  cost. Apply only after approval.
- **Wrong account:** always use `AWS_PROFILE=thehrdwood`.
- **Broken API origin:** CloudFront needs the exact Railway domain before
  Terraform apply.
- **Secret exposure:** keep provider keys and AWS credentials in Railway
  variables only.
- **CloudFront propagation:** distribution and invalidations can take minutes;
  keep the local tunnel path as a fallback during development.

## Live Resource Outputs

- Railway service: `vibecoding-colective-macpaw`
- Railway URL: `https://vibecoding-colective-macpaw-production.up.railway.app`
- S3 bucket: `vibecoding-colective-macpaw-frontend`
- CloudFront distribution: `E1LXAVVGHT4YKQ`
- CloudFront URL: `https://d1uswfdwd46dyc.cloudfront.net`
