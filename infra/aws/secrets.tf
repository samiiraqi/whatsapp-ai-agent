# These create empty secret containers only. No secret values are set
# here - populate them out-of-band (AWS console, CLI, or a deploy
# pipeline) after applying, per CLAUDE.md's "no real secrets in code
# or git" rule.

resource "aws_secretsmanager_secret" "whatsapp_app_secret" {
  name = "${local.name_prefix}-whatsapp-app-secret"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-whatsapp-app-secret"
  })
}

resource "aws_secretsmanager_secret" "whatsapp_verify_token" {
  name = "${local.name_prefix}-whatsapp-verify-token"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-whatsapp-verify-token"
  })
}
