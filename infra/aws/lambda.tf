# Placeholder deployment package only - infra/aws/lambda/index.js is a
# stub. The real webhook handler is app/server; wiring it up as a
# Lambda-compatible adapter is future work (see docs/decisions.md).

# Failed async invocations land here instead of being silently dropped.
# SQS has no fixed monthly fee, so this stays cheap even idle.
resource "aws_sqs_queue" "lambda_dlq" {
  name = "${local.name_prefix}-webhook-dlq"

  # SSE-SQS: Amazon's own managed key, free (unlike a customer-managed
  # KMS key, which has a per-key monthly charge).
  sqs_managed_sse_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-webhook-dlq"
  })
}

resource "aws_lambda_function" "webhook" {
  function_name = "${local.name_prefix}-webhook"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout

  # Caps concurrent invocations so a traffic spike can't spin up
  # unbounded concurrency (and unbounded cost) on this small deployment.
  reserved_concurrent_executions = var.lambda_reserved_concurrency

  filename         = "${path.module}/lambda/placeholder.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda/placeholder.zip")

  environment {
    variables = {
      DYNAMODB_CONVERSATIONS_TABLE = aws_dynamodb_table.conversations.name
      DYNAMODB_LEADS_TABLE         = aws_dynamodb_table.leads.name
      WHATSAPP_APP_SECRET_ARN      = aws_secretsmanager_secret.whatsapp_app_secret.arn
      WHATSAPP_VERIFY_TOKEN_ARN    = aws_secretsmanager_secret.whatsapp_verify_token.arn
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.lambda_dlq.arn
  }

  # X-Ray's free tier (100k traces/month) comfortably covers this
  # small, low-traffic deployment.
  tracing_config {
    mode = "Active"
  }

  depends_on = [aws_cloudwatch_log_group.lambda]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-webhook"
  })
}
