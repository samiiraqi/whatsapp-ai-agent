# AWS vs. Azure: service mapping

Both `infra/aws` and `infra/azure` provision the same small, cheap
design for the webhook — written and validated only, never applied.
This maps each piece to its counterpart. See `infra/aws/README.md`
and `infra/azure/README.md` for the checkov findings on each side,
and `infra/azure/README.md`'s "Where this differs from AWS" for the
handful of places the mapping isn't 1:1.

| Purpose | AWS | Azure |
|---|---|---|
| Compute (webhook handler) | Lambda (Node.js 20) | Azure Functions (Node.js 20, Linux, Consumption plan) |
| HTTP entry point | API Gateway (HTTP API) | Built into Azure Functions' HTTP trigger — no separate resource |
| Request throttling | Built into the API Gateway stage, free | Not available for free — needs API Management or Front Door (see infra/azure/README.md) |
| Resource container | Implicit (account + region) | Explicit `azurerm_resource_group` |
| Compute's own storage | None needed | Storage account required for Function runtime state |
| Database | DynamoDB (2 tables, on-demand) | Cosmos DB, SQL API (2 containers, serverless) |
| Database encryption at rest | Explicit `server_side_encryption` block | On by default, no config needed |
| Secret storage | Secrets Manager (empty containers allowed) | Key Vault (secrets need a value at creation — see below) |
| Identity for compute | IAM role (least-privilege policy document) | System-assigned managed identity + RBAC role assignments |
| Database access control | IAM policy scoped to table ARNs | Cosmos DB's own data-plane RBAC, scoped per container |
| Logs | CloudWatch Log Group (14-day retention here) | Log Analytics workspace (30-day retention here) |
| Tracing/APM | X-Ray | Application Insights (workspace-based, backed by Log Analytics) |
| Cost control | AWS Budget (alert at a variable limit) | Consumption Budget, scoped to the resource group |
| Async failure handling | Lambda dead-letter queue (SQS) | Not configured — Azure Functions' retry/failure model differs; out of scope here |

## Notable asymmetries

- **Secrets Manager vs. Key Vault**: AWS lets you create a secret
  *container* with no value. Azure's Terraform resource for a Key
  Vault secret requires a real value up front, so `infra/azure` only
  provisions the vault itself — the two secrets are created
  out-of-band after a real deploy.
- **Lambda's local package hook vs. Functions**: `aws_lambda_function`
  references a local zip directly (`filebase64sha256(...)`), which is
  why `infra/aws/lambda/placeholder.zip` exists and is wired into
  Terraform. Azure has no equivalent attribute; `infra/azure/function/`
  is a placeholder for the same illustrative reason but isn't
  referenced by any `.tf` resource — Azure deployment is always a
  separate step.
- **One RBAC system vs. two**: AWS IAM uniformly covers both
  "can this role call this API" and "can this role touch this
  resource." Azure splits this into general control-plane RBAC
  (`azurerm_role_assignment`, used here for Storage and Key Vault)
  and Cosmos DB's own separate data-plane RBAC
  (`azurerm_cosmosdb_sql_role_assignment`).
- **Throttling costs more on Azure.** This is the most consequential
  difference for a real deployment: AWS gets basic request throttling
  for free as part of API Gateway; getting the same protection on
  Azure means adding API Management or Front Door, which is itself a
  billed resource. Neither is included here, to keep the design small
  and cheap on both sides equally — but it means the Azure side is
  more exposed to a request flood by default until one is added.

## Shared limitation on both sides

Both `infra/aws` and `infra/azure` only provision infrastructure —
neither includes a real store adapter. The local app (`app/server`)
uses SQLite (`ConversationStore`, `LocalCrm`); a real deployment on
either cloud needs a DynamoDB- or Cosmos DB-backed implementation of
those same interfaces (see `docs/decisions.md`), not a change to the
conversation engine itself.
