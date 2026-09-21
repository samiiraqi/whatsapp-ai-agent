# Mirrors DynamoDB's two tables. Cosmos DB is encrypted at rest by
# default (Microsoft-managed key) - there's no separate "encryption
# on" toggle to set, unlike aws_dynamodb_table.
#
# local_authentication_enabled = false turns off key-based access
# entirely, so the only way in is the RBAC role assignments below -
# no connection string or key ever needs to exist in app settings.

resource "azurerm_cosmosdb_account" "main" {
  name                = "${local.name_prefix}-cosmos"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  capabilities {
    name = "EnableServerless"
  }

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    location          = azurerm_resource_group.main.location
    failover_priority = 0
  }

  minimal_tls_version                = "Tls12"
  local_authentication_enabled       = false
  public_network_access_enabled      = true # VNet/private endpoint costs extra; see README
  access_key_metadata_writes_enabled = false

  tags = local.common_tags
}

resource "azurerm_cosmosdb_sql_database" "main" {
  name                = "${local.name_prefix}-db"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
}

resource "azurerm_cosmosdb_sql_container" "conversations" {
  name                = "conversations"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.main.name
  partition_key_paths = ["/phoneHash"]
}

resource "azurerm_cosmosdb_sql_container" "leads" {
  name                = "leads"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.main.name
  partition_key_paths = ["/id"]
}
