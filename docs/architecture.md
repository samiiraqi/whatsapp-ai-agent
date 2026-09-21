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
        |-- await brain.reply({ text, history }) -----> BrainAdapter
        |     returns { text, handoff }                MockBrain (default) or
        |                                               ClaudeBrain (BRAIN=claude +
        |                                               ANTHROPIC_API_KEY), same
        |                                               interface either way
        |
        |-- store.addMessage(phone, "out", reply)
        |-- store.setHandoff(phone, true) (if handoff)
        |
        v
  sender.send(phone, reply) -------------------------> MessageSender
                                                         (FakeMessageSender today,
                                                         stores in memory, no
                                                         network call)

  GET /dev/outbox, /dev/leads, /dev/conversations
  (only when DEV_SIMULATOR=true, localhost only)
        ^                              ^
        |  polled every ~1.5s          |  polled every 3s
        |                              |
  app/simulator/server.js        app/dashboard (Vite dev server,
        |                         proxies /dev/* straight to
        v                         app/server, no backend of its own)
  browser renders reply bubbles         |
  + "Handed to human" badge             v
                                  browser renders Overview /
                                  Conversations / Leads tabs
                                  ("Handed to human" badge,
                                  Hebrew/Arabic rendered rtl)
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
- **BrainAdapter** — interface: `reply(context) -> { text, handoff }`
  (async — always `await` it; a plain synchronous return, like
  MockBrain's, still works). `context` is `{ text, history }`, where
  `history` is that conversation's messages so far as returned by
  `ConversationStore.getMessages`.
  - **`MockBrain` (`src/mockBrain.js`, the default)** — answers
    questions about hours, products/prices, and address from
    `config/business.json` using simple keyword matching, detects
    Hebrew/Arabic/English by script, and returns `handoff: true` with
    a polite message when asked for a human or when it doesn't
    recognize the question. Each product's `name` in
    `config/business.json` is `{ en, ar, he }`; a price question
    naming one product (matched by any word of its name in the
    customer's language, e.g. "الخبز" for "خبز طازج") gets a reply
    about only that product, in that language — otherwise MockBrain
    lists all products.
  - **`ClaudeBrain` (`src/claudeBrain.js`, off by default)** — the
    real AI brain, using `@anthropic-ai/sdk`. Only used when
    `BRAIN=claude` and `ANTHROPIC_API_KEY` are both set (see
    `index.js`); otherwise `MockBrain` is used regardless. Model
    comes from `ANTHROPIC_MODEL` (default
    `claude-haiku-4-5-20251001`). The system prompt is built once
    from `config/business.json` (same facts MockBrain uses: hours,
    products/prices, address) and asks the model to reply in the
    customer's language, in short WhatsApp-style sentences, never
    inventing a price/hours/product, as a JSON object
    (`{text, handoff}`) — which is parsed and shape-validated before
    use. See
    [security.md](security.md#the-real-ai-brain-claudebrain) for
    prompt-injection handling, the fallback-on-any-failure behavior,
    and how cost is bounded (`max_tokens`, last-10-messages history,
    a per-request timeout, and `AI_DAILY_CAP`).
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
  never reaches the browser. If `app/server` isn't reachable, `/send`
  and `/outbox` return a `503` with a clear JSON error instead of
  crashing, and the chat UI shows a "Server is not running" banner.
  See [security.md](security.md#dev-endpoint-get-devoutbox) for the
  `/dev/outbox` / `/dev/leads` / `/dev/conversations` guardrails.
- **Dashboard (`app/dashboard`)** — a React (Vite) app with no
  backend of its own: the Vite dev server, bound to `127.0.0.1`,
  proxies any `/dev/*` request straight to `app/server`
  (`APP_SERVER_URL`). Three tabs — Overview (counts), Conversations
  (list + message thread, `GET /dev/conversations`), Leads (table,
  `GET /dev/leads`) — refreshed every 3 seconds. Hebrew/Arabic
  message bubbles and table cells render with `dir="rtl"`.
  `GET /dev/conversations` returns each conversation's short id
  (first 8 characters of the phone hash), its language (detected
  from the latest message), handoff status, last message time, and
  its messages.

## Not yet built

- a real WhatsApp `MessageSender` (`ClaudeBrain`, the real
  `BrainAdapter`, now exists — see above — but is off by default per
  CLAUDE.md, same as a real `MessageSender` would be)
