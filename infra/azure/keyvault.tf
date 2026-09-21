# Unlike aws_secretsmanager_secret, Terraform's azurerm_key_vault_secret
# resource requires a real value at creation time - there is no "empty
# container" equivalent. To honor "no values in code", this config
# creates only the vault itself. The two secrets (whatsapp-app-secret,
# whatsapp-verify-token) must be created out-of-band after a real
# deploy, e.g.:
#   az keyvault secret set --vault-name <name> --name whatsapp-app-secret --value <value>
# See infra/azure/README.md.

data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "main" {
  name                = "${local.name_prefix}-kv"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"

  rbac_authorization_enabled = true
  purge_protection_enabled   = true

  soft_delete_retention_days = 7

  # Explicit firewall config (still Allow-by-default: a Deny default
  # needs a maintained IP allow-list, which is the same networking-cost
  # tradeoff as the private-endpoint items in README's deferred list).
  network_acls {
    default_action = "Allow"
    bypass         = "AzureServices"
  }

  tags = local.common_tags
}
