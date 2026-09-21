# Maps to CloudWatch Logs on the AWS side. Application Insights here
# is workspace-based (backed by the Log Analytics workspace), which is
# the modern equivalent of CloudWatch Logs + X-Ray combined.

resource "azurerm_log_analytics_workspace" "main" {
  name                = "${local.name_prefix}-logs"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "PerGB2018"
  retention_in_days   = var.log_retention_days

  tags = local.common_tags
}

resource "azurerm_application_insights" "main" {
  name                = "${local.name_prefix}-appinsights"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "Node.JS"
  retention_in_days   = var.log_retention_days

  tags = local.common_tags
}
