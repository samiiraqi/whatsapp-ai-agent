# WhatsApp AI Agent

A smart WhatsApp agent for small businesses. It answers customer
messages, follows conversation flows, saves leads to a simple CRM,
and hands over to a human when unsure. Supports Hebrew, Arabic, and
English.

This project runs locally only. Nothing is deployed — Terraform
under `infra/` is written and validated but never applied.

## Running locally

1. Copy `.env.example` to `.env` and fill in `WHATSAPP_APP_SECRET`
   and `WHATSAPP_VERIFY_TOKEN` with any local placeholder values. Set
   `DEV_SIMULATOR=true` so the chat simulator can read the agent's
   replies.
2. Start the webhook server:
   ```
   cd app/server
   npm install
   npm start
   ```
   It listens on `http://localhost:3000` (see `PORT` in `.env`).
3. In another terminal, start the chat simulator:
   ```
   cd app/simulator
   npm install
   npm start
   ```
   It listens on `http://127.0.0.1:4000`.
4. Open `http://127.0.0.1:4000` in a browser and chat with the agent.
   The simulator signs each message on the server side and posts it
   to the webhook — the browser never sees `WHATSAPP_APP_SECRET`.

Run each app's tests with `npm test` inside `app/server` or
`app/simulator`.

## Architecture
