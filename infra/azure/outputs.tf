output "function_app_name" {
  description = "Name of the webhook Function App."
  value       = azurerm_linux_function_app.webhook.name
}

output "function_app_default_hostname" {
  description = "Default hostname for the Function App (append /api/webhook)."
  value       = azurerm_linux_function_app.webhook.default_hostname
}

output "cosmosdb_account_endpoint" {
  description = "Cosmos DB account endpoint."
  value       = azurerm_cosmosdb_account.main.endpoint
}

output "cosmosdb_conversations_container_name" {
  description = "Name of the Cosmos DB conversations container."
  value       = azurerm_cosmosdb_sql_container.conversations.name
}

output "cosmosdb_leads_container_name" {
  description = "Name of the Cosmos DB leads container."
  value       = azurerm_cosmosdb_sql_container.leads.name
}

output "key_vault_uri" {
  description = "URI of the Key Vault (empty container - see infra/azure/README.md)."
  value       = azurerm_key_vault.main.vault_uri
}

output "log_analytics_workspace_name" {
  description = "Name of the Log Analytics workspace."
  value       = azurerm_log_analytics_workspace.main.name
}

output "application_insights_connection_string" {
  description = "Application Insights connection string."
  value       = azurerm_application_insights.main.connection_string
  sensitive   = true
}
