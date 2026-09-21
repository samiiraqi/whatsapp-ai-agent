# WhatsApp AI Agent

<!--
CI badge placeholder: replace OWNER/REPO below with this repo's actual
GitHub path after the first push (the workflow won't have any runs to
report on until then, so the badge shows "no status" until it does).
-->
[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)

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
5. In a third terminal, start the dashboard:
   ```
   cd app/dashboard
   npm install
   npm run dev
   ```
   It listens on `http://127.0.0.1:5173` and proxies `/dev/*`
   requests to `app/server` (see `APP_SERVER_URL` in `.env`). Open it
   in a browser to see conversation counts, the conversation list
   with message threads, and captured leads — all refreshed every 3
   seconds.

All three apps read `DEV_SIMULATOR=true` from `.env`; without it,
`app/server`'s dev-only `/dev/*` endpoints don't exist, and the
simulator and dashboard have nothing to poll.

Run each app's tests with `npm test` inside `app/server`,
`app/simulator`, or `app/dashboard`.

## Architecture
