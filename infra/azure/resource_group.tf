# Azure has no exact equivalent of "an AWS account/region" as a
# container for resources - everything lives inside an explicit
# resource group. See docs/aws-vs-azure.md.

resource "azurerm_resource_group" "main" {
  name     = "${local.name_prefix}-rg"
  location = var.azure_location

  tags = local.common_tags
}
