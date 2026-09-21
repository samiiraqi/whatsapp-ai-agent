# infra/azure

Terraform for a small, cheap Azure deployment of the webhook, mapped
from `infra/aws`. **Written and validated only** — never applied from
here. See CLAUDE.md's hard rules: no `terraform apply`, no `az login`,
no Azure command that creates resources, only `terraform fmt` and
`terraform validate`.

## What's here

- **Azure Functions (Node.js 20, Linux, Consumption plan)** — one
  HTTP-triggered function handling both `GET` and `POST /webhook`
  (`infra/azure/function/webhook/`). Consumption ("Y1") means
  pay-per-execution with no idle cost, like Lambda.
- **Cosmos DB (serverless, SQL API)** — `conversations` and `leads`
  containers, encrypted at rest by default. Key-based access
  (`local_authentication_enabled = false`) is turned off entirely —
  the Function reaches it only via its managed identity.
- **Key Vault** — an empty vault for `WHATSAPP_APP_SECRET` and
  `WHATSAPP_VERIFY_TOKEN`. No values in Terraform; see below for why.
- **System-assigned managed identity** on the Function App, granted
  exactly three things via RBAC: `Storage Blob Data Owner` on its own
  storage account, and `Key Vault Secrets User` scoped to each of the
  two secrets individually (not the whole vault) — plus Cosmos DB's
  own data-plane RBAC ("Data Contributor") scoped per-container. No
  keys or connection strings appear anywhere in `app_settings`.
- **Log Analytics workspace + Application Insights**, 30-day
  retention — the CloudWatch Logs + X-Ray equivalent.
- **Consumption Budget**, scoped to this resource group (not the
  whole subscription — no hardcoded subscription ID needed), alerting
  `var.budget_alert_email` at 80% actual and 100% forecasted spend.

Every resource is tagged with `Project`, `Environment`, and
`ManagedBy` via `local.common_tags` in `locals.tf`.

## Running it

```
cd infra/azure
terraform fmt
terraform init -backend=false
terraform validate
```

Same as `infra/aws`: no credentials needed for any of these three
commands. `budget_alert_email` has no default — a real `plan`/`apply`
(out of scope here) would need it supplied via `.tfvars` or `-var`.

## Where this differs from AWS

- **Throttling needs a separate paid service.** AWS's HTTP API had
  built-in per-route throttling for free. Azure Functions has no
  built-in request-rate limiting on its HTTP trigger — the equivalent
  requires putting API Management (even the cheapest "Consumption"
  APIM tier still adds its own resource and cost) or Front Door with
  a WAF rate-limit rule in front of the Function. Given "small and
  cheap," this config does **not** add either; a real deployment
  under real WhatsApp traffic should add one before going live.
- **No local "deployment package" hook.** AWS's `aws_lambda_function`
  takes a local `filename` + `filebase64sha256(...)`, so Terraform
  can validate against a real placeholder zip without deploying
  anything. Azure's `azurerm_linux_function_app` has no equivalent
  attribute — deployment is always a separate step (`func azure
  functionapp publish`, a zip-deploy API call, or `WEBSITE_RUN_FROM_PACKAGE`
  pointing at a blob). `infra/azure/function/webhook/` exists for the
  same illustrative purpose as `infra/aws/lambda/index.js`, but no
  `.tf` resource references it.
- **Key Vault secrets can't be "empty."** `aws_secretsmanager_secret`
  is a container you can create with no value. Terraform's
  `azurerm_key_vault_secret` requires a real `value` at creation —
  there's no empty-secret equivalent. To honor "no values in code,"
  this config creates only the vault; the two secrets must be added
  out-of-band after a real deploy (`az keyvault secret set
  --vault-name <name> --name whatsapp-app-secret --value <value>`).
  The RBAC role assignments in `function_app.tf` are still scoped to
  those two secret names in advance, even though the secrets don't
  exist yet — Azure RBAC scope strings don't require the target
  object to already exist.
- **A storage account is mandatory.** Consumption-plan Functions need
  a storage account for their own internal state; Lambda has no such
  requirement. `storage_uses_managed_identity = true` means it's used
  without ever putting its access key anywhere.
- **Two separate RBAC systems.** Cosmos DB's data-plane role
  assignments (`azurerm_cosmosdb_sql_role_assignment`) are a distinct
  system from Azure's general control-plane RBAC
  (`azurerm_role_assignment`, used for Storage and Key Vault here) —
  AWS IAM covers both cases uniformly.
- **Log retention: 30 days here vs. 14 for AWS.** That's this
  project's explicit choice for each cloud, not an inconsistency to
  fix.

## Checkov

Run with `checkov -d .`. Current result: **18 passed, 15 failed**
(plus 2 unrelated "secrets scan" false positives — see below). Fixed
5 findings directly, all free (no cost, no capability lost):
`access_key_metadata_writes_enabled = false` on Cosmos DB,
`shared_access_key_enabled = false` + a `sas_policy` +
`blob_properties.delete_retention_policy` on the storage account, and
an explicit `network_acls` block on the Key Vault.

**Checkov/provider-version mismatch (1 finding, already actually
fixed): `CKV_AZURE_140`** — "Local Authentication is disabled on
CosmosDB" is reported as failing, but `cosmosdb.tf` already sets
`local_authentication_enabled = false`. Checked checkov's own policy
source
(`checkov/terraform/checks/resource/azure/CosmosDBLocalAuthDisabled.py`):
it looks for an attribute literally named `local_authentication_disabled
= true`, which was azurerm's *pre-v5* attribute name. The provider
pinned here (`~> 5.0`) renamed it to `local_authentication_enabled`
(and inverted the boolean); checkov 3.2.490 hasn't caught up to that
rename. This is a real false failure, not a gap — the setting the
check wants is genuinely in place.

**Customer-managed keys (2 findings: `CKV_AZURE_100` on Cosmos DB,
`CKV2_AZURE_1` on the storage account)** — same reasoning as the AWS
side's KMS findings: both are already encrypted at rest with
Microsoft-managed keys for free; a customer-managed key is a real
recurring cost for marginal benefit at this project's stage, and the
storage account only holds the Function's own internal plumbing, not
user data (that's Cosmos DB).

**Private networking (8 findings: `CKV_AZURE_99`, `CKV_AZURE_101`,
`CKV_AZURE_221`, `CKV_AZURE_189`, `CKV_AZURE_109`, `CKV_AZURE_59`,
`CKV2_AZURE_33`, `CKV2_AZURE_32`)** — restricting Cosmos DB, the
Function App, Key Vault, and the storage account to private-only
access needs either a maintained IP allow-list or a VNet with private
endpoints for every one of them, plus VNet integration for the
Function App to reach them. That's the same cost/complexity tradeoff
as `infra/aws`'s decision not to put the Lambda in a VPC — deferred
for the same reason.

**Consumption-plan scaling model (2 findings: `CKV_AZURE_225` zone
redundancy, `CKV_AZURE_212` minimum instance count)** — both need a
Premium plan (EP1+, a fixed ~$150+/month baseline) instead of the
"Y1" Consumption plan used here. Consumption's whole value
proposition for "small and cheap" is scaling to zero with no idle
cost; a minimum instance count is a direct contradiction of that.

**Low value for internal plumbing storage (2 findings: `CKV_AZURE_33`
Queue-service logging, `CKV_AZURE_206` replication tier)** — this
storage account exists only for the Function runtime's own state, not
application data. Detailed Queue diagnostics and upgrading from
locally-redundant (LRS) to zone/geo-redundant storage add cost and
complexity disproportionate to what's stored here.

**Secrets scan: 2 false positives (`CKV_SECRET_6`, "Base64 High
Entropy String")** — flagged on `function_app.tf`'s
`WHATSAPP_APP_SECRET_NAME = "whatsapp-app-secret"` and
`WHATSAPP_VERIFY_TOKEN_NAME = "whatsapp-verify-token"`. These are
Key Vault secret *names* (used to look the real secret up at
runtime), not values — checkov's generic entropy heuristic just
doesn't like hyphenated lowercase strings of that length. No secret
value exists anywhere in this repository.

## Real deployment adapter

Same note as `infra/aws`: the local app (`app/server`) uses SQLite
(`ConversationStore`, `LocalCrm`). A real Azure deployment needs a
Cosmos DB-backed implementation of those same interfaces, not a
drop-in swap — see `docs/decisions.md` and `docs/aws-vs-azure.md`.
