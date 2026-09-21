# Security: WhatsApp webhook

## Verification handshake (GET /webhook)
WhatsApp confirms webhook ownership with a GET request carrying
`hub.mode`, `hub.verify_token`, and `hub.challenge`. We compare the
token against `WHATSAPP_VERIFY_TOKEN` and only echo back the
challenge on a match, so only WhatsApp (or someone who knows the
token) can complete setup. Any mismatch returns 403.

## Signature verification (POST /webhook)
Every incoming webhook call is signed by WhatsApp with
`X-Hub-Signature-256`, an HMAC-SHA256 of the raw request body using
our app secret (`WHATSAPP_APP_SECRET`). We:

- Read the body with `express.raw()` so we hash the exact bytes that
  were sent, not a re-serialized version of the parsed JSON. Hashing
  parsed-then-re-stringified JSON can produce different bytes
  (key order, spacing) and cause valid requests to fail, or worse,
  make it easy to accept a body that doesn't match what was actually
  signed.
- Recompute the expected signature and compare it to the header with
  `crypto.timingSafeEqual`, not `===`. A plain string comparison
  exits early on the first differing byte, which leaks timing
  information an attacker could use to guess the signature
  byte-by-byte.
- Reject with 401 whenever the header is missing, malformed, or
  doesn't match — and skip processing entirely in that case. Only
  JSON is parsed after the signature check passes.

## Secrets
- `WHATSAPP_APP_SECRET` and `WHATSAPP_VERIFY_TOKEN` are read from the
  environment, never hard-coded.
- `.env` is git-ignored; `.env.example` only holds placeholder
  values.
- No log statement prints the secrets, the raw request body, or full
  message text — only non-sensitive metadata (e.g. that a message
  was received) would be logged, once logging is added.

## Outgoing messages
Replies go through a `MessageSender` interface. The only
implementation right now is `FakeMessageSender`, which stores
messages in memory and makes no network calls — there's no real
WhatsApp credential or outbound traffic yet, which keeps the current
attack surface limited to the webhook endpoint itself.

## Dev endpoint: GET /dev/outbox
The chat simulator (`app/simulator`) needs a way to read the agent's
replies without a real WhatsApp account, so `app/server` exposes
`GET /dev/outbox`. It is not part of the WhatsApp integration and is
locked down accordingly:

- The route is only registered at all when `DEV_SIMULATOR=true`. With
  the default `DEV_SIMULATOR=false` (as shipped in `.env.example`),
  the route doesn't exist and the server returns a plain 404.
- Even when enabled, every request is checked against the connecting
  IP and rejected with 403 unless it comes from localhost
  (`127.0.0.1` / `::1`).
- It returns only development data — outgoing messages already held
  in memory by `FakeMessageSender`, plus each conversation's handoff
  flag — never secrets or request signatures.

`DEV_SIMULATOR=true` must never be set in a deployment reachable from
outside localhost; it exists purely to let the local `app/simulator`
UI poll for the agent's replies during development.

`GET /dev/leads` and `GET /dev/conversations` follow the exact same
rules — same flag, same localhost-only check. `/dev/conversations`
(used by `app/dashboard`) returns each conversation's messages, so
like the others it must never be reachable outside localhost or a
local dev environment.

## Lead capture and the CRM adapter
Leads go through a `CrmAdapter` interface (`saveLead(lead)`). The
only implementation right now is `LocalCrm`, which writes to a local
SQLite table and makes no network calls. A lead is stored as
`{ name, item, language, createdAt, conversationHash }` —
`conversationHash` is the same SHA-256 hash of the phone number used
elsewhere in the store; the raw phone number is never written here
either.

This means a lead currently can't actually be contacted back — there
is no phone number on file, by design, while the CRM is local-only.
A real CRM adapter (built later behind the same `CrmAdapter`
interface) would need the actual phone number to be useful, and at
that point storing it requires explicit customer consent (e.g.
captured as part of the order flow) and a real data-retention policy,
not just the hash used for local conversation bookkeeping.
