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

## Third-party action pinning in .github/workflows/ci.yml (2026-09-21)

**Decision:** every third-party GitHub Action the workflow actually
uses is pinned to a full commit SHA (with the version as a trailing
comment), looked up live via the GitHub API right before writing the
file:

- `actions/checkout` → `3d3c42e5aac5ba805825da76410c181273ba90b1` (v7.0.1)
- `actions/setup-node` → `820762786026740c76f36085b0efc47a31fe5020` (v7.0.0)
- `hashicorp/setup-terraform` → `dfe3c3f87815947d99a8997f908cb6525fc44e9e` (v4.0.1)

No gap here — every action actually in use is SHA-pinned. Two tools
the task named (checkov, gitleaks) are deliberately **not** run via
their marketplace Actions at all, so there was nothing to pin for
them:

- **checkov**: installed with `pipx install checkov==3.2.490` instead
  of `bridgecrewio/checkov-action`. Same result, one fewer
  third-party Action (and its own transitive dependencies) to trust
  and keep pinned.
- **gitleaks**: the `secrets` job downloads the official
  `gitleaks/gitleaks` CLI binary directly from its GitHub release
  (pinned to v8.30.1) and verifies it against the sha256 checksum
  published in that release's `_checksums.txt`, instead of using
  `gitleaks/gitleaks-action`. This wasn't just for one-fewer-action:
  `gitleaks-action` v2/v3 require a paid `GITLEAKS_LICENSE` secret for
  any repo owned by a GitHub *organization* (free only for personal
  accounts) — a real trap for CI that would silently need a secret
  nobody asked for, depending on where this repo ends up living. The
  underlying `gitleaks` CLI itself is plain open source (MIT) with no
  such requirement.

If a future action gets added here and a SHA genuinely can't be
looked up safely, pin to the major version tag instead and add a note
in this file — that's the fallback this entry would otherwise be
recording.
