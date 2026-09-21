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
        |-- has an active order flow? --- yes --> continueOrderFlow (src/orderFlow.js)
        |         |                                 |-- "awaiting_name" -> ask for item
        |         |                                 |-- "awaiting_item" -> done:
        |         |                                       crm.saveLead({ name, item,
        |         |                                       language, createdAt,
        |         |                                       conversationHash })
        |         |                               (a "human?" message at either step
        |         |                                exits the flow and hands off instead)
        |         no
        |         |
        |-- wants to order? --- yes --> startOrderFlow (src/orderFlow.js)
        |         |                      asks for name, stores flow state on
        |         |                      the conversation row
        |         no
        |         |
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

  GET /dev/outbox, GET /dev/leads (only when DEV_SIMULATOR=true, localhost only)
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
  incoming message, then, unless already handed off: continues an
  active order flow, or starts one if the message asks to order
  (`src/intents.js`'s `wantsToOrder`, simple EN/HE/AR keywords), or
  otherwise asks the brain for a reply. Records the reply, updates
  handoff status, and sends it. A "human?" message always wins over
  an in-progress order flow.
- **Order flow (`src/orderFlow.js`)** — two-step state machine (ask
  name, ask item, then confirm) kept as JSON in
  `ConversationStore`'s `flow_state` column, so it survives across
  webhook calls per conversation. Completing it returns a lead the
  engine hands to the `CrmAdapter`.
- **CrmAdapter (`src/localCrm.js`)** — interface: `saveLead(lead) ->
  void`. `LocalCrm` writes to a `leads` table in the same SQLite
  file, no network. A real CRM can implement the same interface
  later. See [security.md](security.md#lead-capture-and-the-crm-adapter)
  for why it only ever sees a phone *hash*, never the number.
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
  `/dev/outbox` / `/dev/leads` guardrails.

## Not yet built

- app/dashboard (view conversations/leads)
- a real WhatsApp `MessageSender` and Claude `BrainAdapter`
  (both off by default per CLAUDE.md)
