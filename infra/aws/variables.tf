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

variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "us-east-1"
}

variable "tags" {
  description = "Extra tags merged into every resource's tags, on top of the standard Project/Environment/ManagedBy tags."
  type        = map(string)
  default     = {}
}

variable "log_retention_days" {
  description = "Retention, in days, for CloudWatch log groups."
  type        = number
  default     = 14
}

variable "lambda_memory_size" {
  description = "Memory (MB) allocated to the webhook Lambda."
  type        = number
  default     = 128
}

variable "lambda_timeout" {
  description = "Timeout (seconds) for the webhook Lambda."
  type        = number
  default     = 10
}

variable "lambda_reserved_concurrency" {
  description = "Reserved concurrent executions for the webhook Lambda, capping worst-case concurrency (and cost) for this small deployment."
  type        = number
  default     = 5
}

variable "throttling_burst_limit" {
  description = "API Gateway default route burst throttling limit."
  type        = number
  default     = 10
}

variable "throttling_rate_limit" {
  description = "API Gateway default route steady-state throttling limit (requests/second)."
  type        = number
  default     = 5
}

variable "budget_limit_usd" {
  description = "Monthly AWS budget limit, in USD, that triggers the alert. Kept low since this is meant to run small and cheap."
  type        = number
  default     = 10
}

variable "budget_alert_email" {
  description = "Email address that receives the AWS Budget alert. Must be supplied explicitly (e.g. via a .tfvars file); there is no default."
  type        = string
}
