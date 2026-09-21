# Architecture

## Message flow

```
Browser (app/simulator UI)              WhatsApp Cloud API
        |                                       |
        |  POST /send { phone, text }           |  POST /webhook
        v                                       |  (signed with
  app/simulator/server.js                       |   X-Hub-Signature-256)
   (signs with WHATSAPP_APP_SECRET,              |
    secret never reaches the browser)            |
        |                                       |
        `-------- POST /webhook (signed) -------'
                          |
                          v
                  app/server/src/app.js
        |
        |  onMessage(message)
        v
 ConversationEngine (src/engine.js)
        |
        |-- store.addMessage(phone, "in", text) -----> ConversationStore (SQLite)
        |                                               phone is hashed (SHA-256)
        |                                               before it touches the DB
        |
        |-- brain.reply({ text }) -------------------> BrainAdapter
        |     returns { text, handoff }                (MockBrain today, a real
        |                                               Claude adapter later,
        |                                               same interface)
        |
        |-- store.addMessage(phone, "out", reply)
        |-- store.setHandoff(phone, true) (if handoff)
        |
        v
  sender.send(phone, reply) -------------------------> MessageSender
                                                         (FakeMessageSender today,
                                                         stores in memory, no
                                                         network call)

  GET /dev/outbox (only when DEV_SIMULATOR=true, localhost only)
        ^
        |  polled every ~1.5s
        |
  app/simulator/server.js  -->  browser renders reply bubbles
                                 + "Handed to human" badge
```

## Pieces

- **Webhook (`src/app.js`)** — verifies the GET handshake and the
  POST signature, extracts text messages from the WhatsApp payload,
  and hands each one to `onMessage`. See [security.md](security.md)
  for the signature details.
- **ConversationEngine (`src/engine.js`)** — the glue: records the
  incoming message, asks the brain for a reply (unless the
  conversation is already handed off to a human), records the reply,
  updates handoff status, and sends the reply.
- **BrainAdapter (`src/mockBrain.js`)** — interface: `reply(context)
  -> { text, handoff }`. `MockBrain` answers questions about hours,
  products/prices, and address from `config/business.json` using
  simple keyword matching, detects Hebrew/Arabic/English by script,
  and returns `handoff: true` with a polite message when asked for a
  human or when it doesn't recognize the question. A real Claude
  adapter can implement the same interface later without changing
  the engine.
- **ConversationStore (`src/store.js`)** — SQLite storage for
  messages and handoff status, keyed by a SHA-256 hash of the phone
  number. The raw phone number is never written to the database.
- **MessageSender (`src/messageSender.js`)** — interface: `send(to,
  text) -> Promise<{ id }>`. `FakeMessageSender` just keeps sent
  messages in memory, so development never makes a real WhatsApp API
  call.
- **Simulator (`app/simulator`)** — a small Express server plus a
  plain HTML/CSS/JS chat UI. The browser only ever talks to the
  simulator's own server (`POST /send`, `GET /outbox`); the simulator
  server builds and signs the WhatsApp-style webhook payload and
  polls `app/server`'s dev-only outbox, so `WHATSAPP_APP_SECRET`
  never reaches the browser. See
  [security.md](security.md#dev-endpoint-get-devoutbox) for the
  `/dev/outbox` guardrails.

## Not yet built

- app/dashboard (view conversations/leads)
- a real WhatsApp `MessageSender` and Claude `BrainAdapter`
  (both off by default per CLAUDE.md)
