# Mirrors app/server's local SQLite tables (see docs/decisions.md for
# why a real deployment needs a DynamoDB store adapter behind the same
# interfaces used locally).

resource "aws_dynamodb_table" "conversations" {
  name         = "${local.name_prefix}-conversations"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "phone_hash"

  attribute {
    name = "phone_hash"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-conversations"
  })
}

resource "aws_dynamodb_table" "leads" {
  name         = "${local.name_prefix}-leads"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-leads"
  })
}
