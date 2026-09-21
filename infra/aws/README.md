# infra/aws

Terraform for a small, cheap AWS deployment of the webhook. **Written
and validated only** — this is never applied from here. See
CLAUDE.md's hard rules: no `terraform apply`, no AWS command that
creates resources, only `terraform fmt` and `terraform validate`.

## What's here

- **API Gateway (HTTP API)** — `GET /webhook` and `POST /webhook`,
  routed to the Lambda, with request throttling on the default stage
  and access logs to CloudWatch.
- **Lambda (Node.js 20)** — `infra/aws/lambda/index.js` is a
  placeholder stub, zipped as `lambda/placeholder.zip`, just so
  `terraform validate` has a real deployment package to hash. The
  real webhook logic is `app/server`; adapting it to run as this
  Lambda is future work (see `docs/decisions.md`). Configured with a
  dead-letter queue, reserved concurrency, and X-Ray tracing.
- **DynamoDB** — `conversations` and `leads` tables, on-demand
  billing, encryption enabled, point-in-time recovery enabled.
- **Secrets Manager** — empty containers for `WHATSAPP_APP_SECRET`
  and `WHATSAPP_VERIFY_TOKEN`. No values are set in Terraform;
  populate them out-of-band after a real deploy.
- **IAM** — one execution role for the Lambda, scoped to exactly the
  DynamoDB tables, secrets, log group, and DLQ it needs (see
  `iam.tf`'s policy document) — no wildcard resources, no attached
  AWS managed policies.
- **CloudWatch Logs** — one log group for the Lambda, one for API
  Gateway access logs, both with 14-day retention.
- **AWS Budget** — a monthly cost budget (`var.budget_limit_usd`,
  default $10) that emails `var.budget_alert_email` at 80% actual
  spend and 100% forecasted spend.

Every resource is tagged with `Project`, `Environment`, and
`ManagedBy`, plus a `Name` tag, via `local.common_tags` in
`locals.tf`.

## Running it

```
cd infra/aws
terraform fmt
terraform init -backend=false
terraform validate
```

`-backend=false` is required here since there's no real backend
configured (and shouldn't be, for a config that's never applied from
a local machine). `terraform validate` doesn't need AWS credentials
and doesn't touch AWS — it only checks the config is internally
consistent.

`budget_alert_email` has no default; `terraform validate` doesn't
need one, but a real `plan`/`apply` (out of scope here) would need it
supplied via a `.tfvars` file or `-var`.

## Checkov

Run with `checkov -d .` (installed via `pip install checkov`).
Current result: **49 passed, 15 failed.** Three findings were fixed
directly (see `lambda.tf`): a dead-letter queue and SQS encryption
(`aws_sqs_queue.lambda_dlq`), reserved concurrency, and X-Ray tracing
— all free or near-free, so fixing them didn't work against the
"small and cheap" brief.

The 15 remaining findings are grouped below, each with why it's
being left as-is for now rather than treated as a bug:

**Customer-managed KMS keys (7 findings: `CKV_AWS_119` ×2 on the
DynamoDB tables, `CKV_AWS_158` ×2 on the log groups, `CKV_AWS_149` ×2
on the secrets, `CKV_AWS_173` on the Lambda's environment variables)**
— every one of these resources is already encrypted at rest using
AWS's own managed keys, at no cost. Checkov wants a *customer*-managed
KMS key instead, which is a real, recurring charge per key
(~$1/month each) for marginal benefit at this project's stage (a
portfolio/dev project with no real traffic or secret values yet — the
Lambda's env vars hold Secrets Manager *ARNs*, not the secret values
themselves). Revisit if this ever handles real customer data.

**`CKV_AWS_309` ×2 — API Gateway routes have no authorizer** — this
is intentional, not an oversight. A WhatsApp webhook is called
unauthenticated by WhatsApp; the actual verification is the
`X-Hub-Signature-256` HMAC check inside the Lambda/app itself (see
`docs/security.md`). Adding an API Gateway authorizer (IAM/JWT) would
reject WhatsApp's real requests. This is the standard pattern for
third-party webhooks.

**`CKV_AWS_117` — Lambda not in a VPC** — putting it in a VPC would
require a NAT Gateway to reach DynamoDB/Secrets Manager's public
endpoints (or VPC endpoints for each), on the order of $32+/month —
disproportionate for a "small and cheap" webhook with no VPC-only
resources to reach.

**`CKV_AWS_272` — no code-signing config** — requires setting up an
AWS Signer signing profile and pipeline before there's even real
Lambda code to sign (today's package is a placeholder stub). Worth
adding once there's a real deployment pipeline.

**`CKV_AWS_338` ×2 — log retention under 1 year** — this is the
explicit 14-day retention this project asked for, not an accident;
shorter retention is also cheaper. Left as-is deliberately.

**`CKV2_AWS_57` ×2 — no automatic secret rotation** — rotation needs
a rotation Lambda and only matters once a secret has a real value and
a live integration depending on it; today these are empty containers
with nothing to rotate. Add rotation alongside the real deploy.

## Real deployment adapter

The local app (`app/server`) stores conversations, messages, and
leads in SQLite (`ConversationStore`, `LocalCrm`). This Terraform
provisions DynamoDB tables with the same *purpose* but a different
shape — a real deployment would need a DynamoDB-backed adapter behind
the same `ConversationStore`/`CrmAdapter`-shaped interfaces, not a
drop-in swap. See `docs/decisions.md`.
