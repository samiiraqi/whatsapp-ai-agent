# docs

Project documentation for the WhatsApp AI Agent.

| Doc | What's in it |
|---|---|
| [architecture.md](architecture.md) | How a message flows through the system (webhook → engine → brain → store → sender), what each piece (`ConversationEngine`, `BrainAdapter`, `CrmAdapter`, `MessageSender`, the simulator, the dashboard) does, and what's not built yet. |
| [security.md](security.md) | Webhook signature verification, secrets handling, the dev-only `/dev/*` endpoints' guardrails, lead capture privacy, and `ClaudeBrain`'s prompt-injection handling and cost caps. |
| [decisions.md](decisions.md) | Why this project's non-obvious calls were made the way they were — e.g. which AWS services and why, how CI's third-party GitHub Actions are pinned. |
| [dependency-audit.md](dependency-audit.md) | `npm audit` findings across the three apps: what was found, what was fixed, what's left and why. |
| [aws-vs-azure.md](aws-vs-azure.md) | Service-by-service mapping between `infra/aws` and `infra/azure` (Lambda ↔ Functions, DynamoDB ↔ Cosmos DB, etc.) and where the two clouds' Terraform genuinely differ. |

Also see [`infra/aws/README.md`](../infra/aws/README.md) and
[`infra/azure/README.md`](../infra/azure/README.md) for each cloud's
own checkov findings and how to run `terraform fmt`/`validate` for
it, and the root [README.md](../README.md) for how to run the project
itself.
