# Azure Functions on a Consumption plan require a storage account for
# their own internal state (triggers, locks, deployment package) -
# there's no AWS equivalent of this requirement for Lambda.

resource "azurerm_storage_account" "function" {
  name                = lower(replace("${local.name_prefix}func", "-", ""))
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  account_tier               = "Standard"
  account_replication_type   = "LRS"
  min_tls_version            = "TLS1_2"
  https_traffic_only_enabled = true

  # No public read access to blobs/containers.
  allow_nested_items_to_be_public = false

  # The Function App reaches this account only via managed identity
  # (see storage_uses_managed_identity in function_app.tf), so the
  # account key can be turned off entirely - free, no functionality lost.
  shared_access_key_enabled = false

  # Free guardrails, in case a SAS or a deleted blob/container ever
  # happens: SAS tokens self-expire, deletes are recoverable for a week.
  sas_policy {
    expiration_period = "01.00:00:00"
    expiration_action = "Log"
  }

  blob_properties {
    delete_retention_policy {
      days = 7
    }
    container_delete_retention_policy {
      days = 7
    }
  }

  tags = local.common_tags
}
