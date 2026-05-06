---
state: in-progress
last_updated: 2026-05-06
owner: Orchestrator
---

# CloudFront Railway Deploy Status

## Packet Status

| Packet | Status | Notes |
| --- | --- | --- |
| Technical contract | Complete | Recorded in `docs/build-system/integrations/cloud-deployment.md`. |
| Local infrastructure files | Complete | Single-environment Terraform, Railway config, and scripts are prepared locally. |
| Local validation | Complete | `npm run build`, `terraform fmt`, and `terraform validate` passed locally. |
| Railway deploy | Complete | Service `vibecoding-colective-macpaw` is deployed and healthy. |
| CloudFront apply and frontend upload | Complete | CloudFront/S3 are created and serving the app. |

## Current Handoff

Cloud deployment is live. Railway is the API origin and CloudFront is the
browser-facing URL.

## Resource Outputs

- Railway service: `vibecoding-colective-macpaw`
- Railway URL: `https://vibecoding-colective-macpaw-production.up.railway.app`
- S3 bucket: `vibecoding-colective-macpaw-frontend`
- CloudFront distribution: `E1LXAVVGHT4YKQ`
- CloudFront URL: `https://d1uswfdwd46dyc.cloudfront.net`

## Validation

- Railway `/health` returned `{"ok":true}`.
- Railway `/api/status` returned `200` with Claude and ElevenLabs configured.
- CloudFront `/` returned `200`.
- CloudFront `/health` returned `{"ok":true}`.
- CloudFront `/api/status` returned `200` with Claude and ElevenLabs configured.
- S3 bucket contains only frontend assets: `index.html` and `assets/*`.

## Notes

An accidental deploy was started against the existing Pult `web` service because
the first local script defaulted to `web`. It was restored from the Pult `main`
worktree and is now `SUCCESS` on deployment
`83fcb31c-5920-4867-bbec-e7bc1723e773`. The local script now defaults to
`vibecoding-colective-macpaw`.
