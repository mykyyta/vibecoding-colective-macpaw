---
state: in-progress
last_updated: 2026-05-07
owner: Planner
---

# Quest Leaderboard

## Purpose

Add a persistent leaderboard after **Exit MacPaw Space** quest completion so a
player can enter a display name and see durable completion results.

## Outcome Shape

- The quest completion flow offers a polished name-entry step.
- The browser submits leaderboard entries through an Express API route.
- The server validates and normalizes submitted names and result metadata.
- Leaderboard data persists in DynamoDB behind the server boundary.
- The player can view the top completion results after finishing the quest.
- A small screen-integrated control can switch the left presentation screen into
  recent completions for quick viewing without turning the primary experience
  into a dashboard.
- The first leaderboard model sorts newest completions first. Completion time
  and attempts are secondary metadata for display, not the primary rank.

## Why Initiative

This changes the product completion loop, adds persistent product data, creates
a server-side API contract, and introduces a durable cloud storage dependency.

## Scope In

- Shared leaderboard request and response types.
- Express routes for creating and reading leaderboard entries.
- DynamoDB-backed storage adapter behind a small leaderboard boundary.
- Environment documentation and `.env.example` entries for DynamoDB settings.
- Quest completion UI for display-name entry and leaderboard display.
- Focused validation for request validation, storage behavior, and completion UI.

## Scope Out

- User accounts or authentication.
- Full moderation workflow.
- Storing raw voice transcripts.
- Complex score formulas beyond the first completion metadata.
- Multiple cloud environments.

## Acceptance Criteria

- A completed player can submit a display name without exposing AWS credentials
  to the browser.
- Leaderboard writes require a server-issued completion token; validation-only
  public writes are not the first-slice contract.
- Names are length-limited, trimmed, and rendered safely.
- The leaderboard survives local server restarts because data is stored in
  DynamoDB.
- The leaderboard read endpoint returns a bounded top list.
- The primary quest UI stays room-first. Before completion, leaderboard access
  is limited to a small neutral control on the left presentation screen that
  switches that in-room screen into recent completions, not a persistent panel
  or dashboard.
- Docs describe the storage boundary, required environment variables, and paid
  resource risk.

## Review Decisions

- The main leaderboard flow is post-completion. A small neutral control may be
  visible on the left presentation screen during the quest for quick viewing,
  but it must stay secondary and integrated into the room. Expanded state
  replaces that screen's content; it is not a side panel, progress panel, or
  dashboard.
- Leaderboard ordering uses server-observed completion time:
  - `startedAt`: server timestamp on the first accepted voice turn in a quest
    session;
  - `completedAt`: server timestamp when the session reaches the escaped or
    door-opened completion state;
  - `durationMs`: `completedAt - startedAt`;
  - `attempts`: count of accepted final voice turns in the session.
- Results are ordered by newest `completedAt` first. `durationMs` and `attempts`
  are shown as context only.
- UX shape:
  - completion state automatically switches the left presentation screen to
    display-name entry and the recent completions list;
  - pre-completion state may show a small neutral board control on the screen;
  - activating the control switches the screen into recent completions with a
    return-to-scene control;
  - the leaderboard should feel like in-room screen content, not an external
    panel or dashboard;
  - the expanded view must not cover the microphone affordance, key characters,
    or the door on desktop or mobile;
  - the screen view is read-only until completion.
- First-slice writes require a server-issued signed completion token. The token
  carries the session id, duration, attempts, completion timestamp, and a nonce.
  The server verifies it before accepting `POST /api/leaderboard`.
- DynamoDB table shape:
  - partition key: `leaderboardId`;
  - sort key: `createdKey`;
  - first leaderboard id: `exit-macpaw-space:v1`;
  - `createdKey` format:
    `completed#<reverseEpochMs:13>#<entryId>`;
  - `reverseEpochMs` is `9999999999999 - completedAtEpochMs`, zero-padded to
    13 digits, so ascending DynamoDB queries return newest entries first;
  - duplicate display names and multiple runs are allowed;
  - top-list reads use a bounded query on one `leaderboardId`, ascending by
    `createdKey`, not a table scan.
- First-slice write protection is pragmatic, not full anti-cheat. The product
  should not present the board as a serious competitive authority until the
  quest session state is fully server-owned and abuse controls are hardened.

## Plan

### Packet 1: Contract Hardening

Goal: define the exact API, shared types, quest-session proof, DynamoDB table
shape, metrics semantics, environment variables, validation rules, and error
responses before implementation.

Scope in:

- Add shared leaderboard request/response types under `src/shared/`.
- Define quest-session request/response changes needed to produce a signed
  completion token.
- Define DynamoDB item shape, `leaderboardId`, `createdKey` format, timestamp
  bounds, tie behavior, and duplicate-run behavior.
- Define environment variables:
  - required for persistent storage: `LEADERBOARD_TABLE_NAME`,
    `LEADERBOARD_COMPLETION_TOKEN_SECRET`;
  - optional defaults: `LEADERBOARD_ID`, `LEADERBOARD_MAX_ENTRIES`,
    `AWS_REGION`;
  - optional kill switches: `LEADERBOARD_ENABLED=false`,
    `LEADERBOARD_WRITE_ENABLED=false`;
  - optional `DYNAMODB_ENDPOINT` for local adapter validation.
- Document request validation: display name trim, length limit, result metadata
  bounds, and no raw transcript storage.
- Document JSON body limits, field allowlisting, expected 4xx/5xx errors, and
  disabled-write behavior.
- Define minimal validation strategy for pure validators and storage adapter
  contract behavior.

Scope out:

- Installing AWS SDK.
- Creating DynamoDB resources.
- Building UI.
- Implementing server-owned quest session persistence beyond the contract.

Files or areas likely touched:

- `src/shared/leaderboard.ts`
- `docs/build-system/architecture/stack.md`
- `.env.example`
- `docs/work/initiatives/quest-leaderboard/status.md`

Acceptance criteria:

- Executor has exact request/response names and fields.
- DynamoDB key design supports bounded newest-first reads without scanning the
  table.
- Environment variables are named and documented without real credentials.
- Completion token behavior and first-slice security limitations are explicit.
- Metric source of truth is clear enough for backend and UI packets.

Validation:

- `npm run typecheck`
- `git diff --check`

Risks or open questions:

- If stronger anti-cheat is required now, this initiative must add fully
  server-owned quest sessions before accepting public leaderboard writes.

### Packet 2: Storage Proof

Goal: prove the DynamoDB key design and adapter behavior before backend and UI
depend on it.

Scope in:

- Add or document an adapter contract test path using either approved DynamoDB
  resources or `DYNAMODB_ENDPOINT` against a local DynamoDB-compatible endpoint.
- Validate that the `createdKey` sorts newest completion first, then unique
  entry id.
- Validate bounded top-list query behavior without a scan.
- Confirm missing table/region/credential errors are recognizable.

Scope out:

- Public Express routes.
- Completion UI.
- Cloud resource creation without explicit approval.

Files or areas likely touched:

- `src/server/leaderboard-dynamodb.ts`
- `src/shared/leaderboard.ts`
- `package.json`
- `package-lock.json`
- optional small test or script file for adapter validation

Acceptance criteria:

- Adapter can write sample entries and query the expected newest-first order.
- The validation path can run without exposing credentials to the browser.
- If no approved real table exists, a local endpoint or injectable fake covers
  sort-key and validation behavior before Packet 3 starts.

Validation:

- `npm run typecheck`
- `npm run build`
- Adapter validation against approved DynamoDB, local endpoint, or injectable
  fake as documented by Packet 1.

Risks or open questions:

- Installing `@aws-sdk/client-dynamodb` and
  `@aws-sdk/lib-dynamodb` changes dependencies.
- Real DynamoDB validation still requires an approved table and credentials.

### Packet 3: Backend API

Goal: implement the server-side leaderboard API, completion-token verification,
and storage boundary.

Scope in:

- Add Express routes:
  - `GET /api/leaderboard`
  - `POST /api/leaderboard`
- Add the quest-session/completion-token server behavior defined in Packet 1.
- Add a leaderboard module under `src/server/` with validation and storage
  adapter boundaries.
- Verify signed completion tokens before writes.
- Return actionable error responses for disabled leaderboard, missing config,
  invalid token, validation failure, and storage failure.
- Keep AWS credentials, signing secret, and table config server-side only.

Scope out:

- Frontend completion UI.
- Terraform or cloud resource creation unless separately approved.
- User accounts or moderation.

Files or areas likely touched:

- `src/server/index.ts`
- `src/server/leaderboard.ts`
- `src/server/leaderboard-dynamodb.ts`
- `src/shared/leaderboard.ts`
- `src/shared/voice.ts`
- `package.json`
- `package-lock.json`

Acceptance criteria:

- `POST /api/leaderboard` rejects missing or invalid completion tokens.
- `POST /api/leaderboard` validates display name and allows only expected
  client fields before writing.
- `GET /api/leaderboard` returns a bounded sorted list.
- Missing DynamoDB config fails clearly without crashing unrelated quest routes.
- No browser bundle imports AWS SDK code.
- JSON body size and field allowlisting are enforced.

Validation:

- `npm run typecheck`
- `npm run build`
- Local `curl` checks for success, validation failure, invalid token, disabled
  writes, and read behavior with mocked, local, or configured storage.

Risks or open questions:

- In-memory quest-session state is acceptable for a first slice only if signed
  completion tokens carry the final metrics needed for a later submit.

### Packet 4: Completion UI

Goal: add the room-first post-quest leaderboard flow.

Scope in:

- Start or attach to a quest session as defined by Packet 1.
- Detect quest completion in `src/client/App.tsx` and retain the server-issued
  completion token.
- Show name entry only after the player reaches the escaped state.
- Submit leaderboard entries to `POST /api/leaderboard`.
- Fetch and render top entries from `GET /api/leaderboard`.
- Add a small neutral screen control for read-only recent completions.
- Render the leaderboard on the left presentation screen on desktop and mobile.
- Keep layout polished on desktop and mobile without adding dev panels.

Scope out:

- Main quest mechanics changes.
- Visible manual command input before completion.
- Authentication.

Files or areas likely touched:

- `src/client/App.tsx`
- `src/client/styles.css`
- `src/shared/leaderboard.ts`

Acceptance criteria:

- The primary screen remains the quest room.
- Name-entry completion flow does not appear before the quest is solved.
- The leaderboard control is neutral by default, read-only before completion,
  and switches the left presentation screen into leaderboard content without
  obscuring voice play.
- Name entry handles loading, success, validation error, and storage error
  states.
- Leaderboard text fits on desktop and mobile.

Validation:

- `npm run typecheck`
- `npm run build`
- Start `npm run dev` and verify desktop and mobile layouts in browser.

Risks or open questions:

- The client must handle missing completion token as a recoverable state, not as
  a silent failed submission.

### Packet 5: Cloud Resource Configuration

Goal: provision or connect the DynamoDB table for the deployed pet project.

Scope in:

- Create or document a DynamoDB table for leaderboard entries.
- Configure Railway environment variables.
- Confirm CloudFront-deployed app can read and write leaderboard entries through
  the Express API.
- Document live resource names and rollback notes.

Scope out:

- Creating resources without explicit approval.
- Multiple environments.
- Custom admin tooling.

Files or areas likely touched:

- `docs/build-system/integrations/cloud-deployment.md`
- `docs/work/initiatives/quest-leaderboard/status.md`
- Infrastructure scripts only if approved and needed.

Acceptance criteria:

- DynamoDB table exists in the approved AWS account.
- Railway has the required server-side variables.
- CloudFront URL can submit and read leaderboard entries.
- Paid resource risk is documented.

Validation:

- `npm run build`
- Smoke test `GET /api/leaderboard` through Railway and CloudFront.
- Submit one test entry, then delete it manually or mark it as test data if
  deletion tooling is not part of the slice.

Risks or open questions:

- DynamoDB cost is low for this shape, but still a paid AWS resource.
- Manual test-data cleanup may be needed until admin tooling exists.

## First Execution Unit

Execute **Packet 1: Contract Hardening**. Do not dispatch backend or UI work
until the timing rule, signed completion-token contract, DynamoDB key schema,
environment variables, and validation/error rules are recorded.

## Owner And Mode

Planner owns packet framing. Architect owns the storage contract. Executor can
implement each packet after the contract is accepted.

## Open Questions

- Which AWS account/profile should own the DynamoDB table?
