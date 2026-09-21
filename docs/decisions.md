# Decisions

## AWS services for infra/aws (2026-09-21)

**Decision:** model a real deployment as API Gateway (HTTP API) →
Lambda (Node.js 20) → DynamoDB + Secrets Manager, written and
validated with Terraform but never applied (see CLAUDE.md's hard
rules and `infra/aws/README.md`).

**Why these services, not others:**
- **API Gateway HTTP API over REST API** — the webhook is a single
  proxy integration with two routes; HTTP APIs are cheaper (~70%
  less per request) and simpler to configure than REST APIs, and this
  project doesn't need REST API's extra features (usage plans, request
  validation models, etc.).
- **Lambda over a long-running server (ECS/EC2)** — the webhook is
  bursty, low-traffic, and stateless per request. Lambda's pay-per-
  invocation pricing means near-zero cost while idle, matching "small
  and cheap." A container/VM would bill for idle time.
- **DynamoDB over RDS** — the app's data access is simple key lookups
  (by phone hash, by lead id), not relational queries or joins.
  DynamoDB's on-demand billing has no idle cost (RDS bills hourly
  whether or not it's used) and no server to patch or size.
- **Secrets Manager over SSM Parameter Store** — this project already
  treats `WHATSAPP_APP_SECRET`/`WHATSAPP_VERIFY_TOKEN` as secrets (see
  `docs/security.md`); Secrets Manager is the AWS-native fit and
  supports rotation later, even though rotation isn't wired up yet
  (see `infra/aws/README.md`'s checkov notes).

**Why this note matters:** the local app (`app/server`) uses SQLite
via `ConversationStore` (conversations + messages) and `LocalCrm`
(leads) — see `docs/architecture.md`. DynamoDB is not a drop-in
replacement for SQLite: different query model (no arbitrary `WHERE`,
no joins), different consistency/transaction semantics, and item-size
limits. A real deployment needs a DynamoDB-backed implementation of
the same `ConversationStore`/`CrmAdapter` shapes the engine already
depends on (both are already written as swappable interfaces for
exactly this reason), not a change to the engine itself. That adapter
doesn't exist yet — `infra/aws` only provisions the tables.
