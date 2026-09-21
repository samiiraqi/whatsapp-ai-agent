output "api_endpoint" {
  description = "Base invoke URL for the HTTP API (append /webhook)."
  value       = aws_apigatewayv2_api.webhook.api_endpoint
}

output "lambda_function_name" {
  description = "Name of the webhook Lambda function."
  value       = aws_lambda_function.webhook.function_name
}

output "dynamodb_conversations_table_name" {
  description = "Name of the DynamoDB conversations table."
  value       = aws_dynamodb_table.conversations.name
}

output "dynamodb_leads_table_name" {
  description = "Name of the DynamoDB leads table."
  value       = aws_dynamodb_table.leads.name
}

output "whatsapp_app_secret_arn" {
  description = "ARN of the (empty) WhatsApp app secret container. Populate its value out-of-band."
  value       = aws_secretsmanager_secret.whatsapp_app_secret.arn
}

output "whatsapp_verify_token_arn" {
  description = "ARN of the (empty) WhatsApp verify token secret container. Populate its value out-of-band."
  value       = aws_secretsmanager_secret.whatsapp_verify_token.arn
}

output "lambda_log_group_name" {
  description = "CloudWatch log group name for the webhook Lambda."
  value       = aws_cloudwatch_log_group.lambda.name
}
