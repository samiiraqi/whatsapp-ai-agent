# WhatsApp AI Agent (portfolio project)

## Goal
A smart WhatsApp agent for small businesses. It answers customer
messages, follows conversation flows, saves leads to a simple CRM,
and hands over to a human when unsure. Languages: Hebrew, Arabic, English.

## Hard rules
- Runs locally only. Never create cloud resources.
- Never run terraform apply, or any aws/az command that creates resources.
  Only terraform fmt and terraform validate.
- No real secrets in code or git. Use .env.example with placeholders.
  .env must be in .gitignore.
- No real WhatsApp number. Use the local chat simulator.
- The AI brain is a mock by default. A real Claude adapter sits behind
  an interface and is off by default.
- Do not mention any company or person from job postings.

## Stack
Node.js 20+, Express, React (Vite), SQLite, Vitest.

## Structure
- app/server: webhook, signature check, conversation engine
- app/dashboard: React dashboard
- app/simulator: local WhatsApp-style chat
- infra/aws and infra/azure: Terraform, written and validated only
- docs/: architecture, decisions, security

## Working style
- One small step at a time.
- After each step: run tests, explain what changed in simple English,
  update docs, and commit with a clear message.
- Security: verify webhook signatures, validate input, rate limit,
  never log secrets.
