# Scoped to this resource group, not the whole subscription: matches
# the "least privilege" spirit (a subscription-level budget would
# need subscription-wide permissions and would track unrelated
# resources too) and needs no hardcoded subscription ID.

resource "azurerm_consumption_budget_resource_group" "main" {
  name              = "${local.name_prefix}-budget"
  resource_group_id = azurerm_resource_group.main.id

  amount     = var.budget_limit_usd
  time_grain = "Monthly"

  time_period {
    # Must be the first of a month; update before a real apply.
    start_date = "2025-01-01T00:00:00Z"
  }

  notification {
    enabled        = true
    threshold      = 80.0
    operator       = "GreaterThan"
    contact_emails = [var.budget_alert_email]
  }

  notification {
    enabled        = true
    threshold      = 100.0
    operator       = "GreaterThan"
    threshold_type = "Forecasted"
    contact_emails = [var.budget_alert_email]
  }
}
