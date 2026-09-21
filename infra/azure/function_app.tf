# Maps to API Gateway + Lambda combined: Azure Functions' HTTP trigger
# is its own endpoint, so there's no separate "API Gateway" resource.
# See docs/aws-vs-azure.md for what that means for throttling.
#
# infra/azure/function/webhook/ holds a placeholder handler for the
# same illustrative purpose as infra/aws/lambda/index.js, but it is
# NOT referenced by any resource below - Azure Functions deployment
# packages aren't wired into the Terraform resource the way Lambda's
# filename/source_code_hash are. See infra/azure/README.md.

resource "azurerm_service_plan" "main" {
  name                = "${local.name_prefix}-plan"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = "Y1" # Consumption plan: pay-per-execution, no idle cost

  tags = local.common_tags
}

resource "azurerm_linux_function_app" "webhook" {
  name                = "${local.name_prefix}-webhook"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.main.id

  storage_account_name          = azurerm_storage_account.function.name
  storage_uses_managed_identity = true # no storage account key anywhere

  https_only = true

  identity {
    type = "SystemAssigned"
  }

  site_config {
    application_insights_connection_string = azurerm_application_insights.main.connection_string
    minimum_tls_version                    = "1.2"
    ftps_state                             = "Disabled"

    application_stack {
      node_version = "20"
    }
  }

  # No secret values, keys, or connection strings here - only
  # references the Function's managed identity can resolve at
  # runtime via RBAC (Key Vault, Cosmos DB) granted below.
  app_settings = {
    FUNCTIONS_WORKER_RUNTIME          = "node"
    COSMOS_DB_ENDPOINT                = azurerm_cosmosdb_account.main.endpoint
    COSMOS_DB_CONVERSATIONS_CONTAINER = azurerm_cosmosdb_sql_container.conversations.name
    COSMOS_DB_LEADS_CONTAINER         = azurerm_cosmosdb_sql_container.leads.name
    KEY_VAULT_URI                     = azurerm_key_vault.main.vault_uri
    WHATSAPP_APP_SECRET_NAME          = "whatsapp-app-secret"
    WHATSAPP_VERIFY_TOKEN_NAME        = "whatsapp-verify-token"
  }

  tags = local.common_tags
}

# --- Least-privilege access for the Function App's managed identity ---

resource "azurerm_role_assignment" "function_storage" {
  scope                = azurerm_storage_account.function.id
  role_definition_name = "Storage Blob Data Owner"
  principal_id         = azurerm_linux_function_app.webhook.identity[0].principal_id
}

resource "azurerm_role_assignment" "function_kv_app_secret" {
  scope                = "${azurerm_key_vault.main.id}/secrets/whatsapp-app-secret"
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_linux_function_app.webhook.identity[0].principal_id
}

resource "azurerm_role_assignment" "function_kv_verify_token" {
  scope                = "${azurerm_key_vault.main.id}/secrets/whatsapp-verify-token"
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_linux_function_app.webhook.identity[0].principal_id
}

# Cosmos DB SQL API has its own data-plane RBAC system, separate from
# Azure control-plane RBAC used above - hence a different resource type.
# "00000000-0000-0000-0000-000000000002" is Cosmos DB's built-in
# "Data Contributor" role (read/write items), Microsoft's well-known ID.
resource "azurerm_cosmosdb_sql_role_assignment" "function_conversations" {
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  role_definition_id  = "${azurerm_cosmosdb_account.main.id}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000002"
  principal_id        = azurerm_linux_function_app.webhook.identity[0].principal_id
  scope               = "${azurerm_cosmosdb_account.main.id}/dbs/${azurerm_cosmosdb_sql_database.main.name}/colls/${azurerm_cosmosdb_sql_container.conversations.name}"
}

resource "azurerm_cosmosdb_sql_role_assignment" "function_leads" {
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  role_definition_id  = "${azurerm_cosmosdb_account.main.id}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000002"
  principal_id        = azurerm_linux_function_app.webhook.identity[0].principal_id
  scope               = "${azurerm_cosmosdb_account.main.id}/dbs/${azurerm_cosmosdb_sql_database.main.name}/colls/${azurerm_cosmosdb_sql_container.leads.name}"
}
