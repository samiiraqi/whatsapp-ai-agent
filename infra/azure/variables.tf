variable "project_name" {
  description = "Short name used to prefix and tag every resource."
  type        = string
  default     = "whatsapp-ai-agent"
}

variable "environment" {
  description = "Deployment environment name (e.g. dev, staging, prod)."
  type        = string
  default     = "dev"
}

variable "azure_location" {
  description = "Azure region to deploy into."
  type        = string
  default     = "eastus"
}

variable "tags" {
  description = "Extra tags merged into every resource's tags, on top of the standard Project/Environment/ManagedBy tags."
  type        = map(string)
  default     = {}
}

variable "log_retention_days" {
  description = "Retention, in days, for the Log Analytics workspace and Application Insights."
  type        = number
  default     = 30
}

variable "budget_limit_usd" {
  description = "Monthly cost budget limit, in USD, that triggers the alert. Kept low since this is meant to run small and cheap."
  type        = number
  default     = 10
}

variable "budget_alert_email" {
  description = "Email address that receives the budget alert. Must be supplied explicitly (e.g. via a .tfvars file); there is no default."
  type        = string
}
