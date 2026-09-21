# app/simulator

Local WhatsApp-style chat UI used for testing conversations without
a real WhatsApp number. A small Express server signs each message
with `WHATSAPP_APP_SECRET` and posts it to `app/server`'s webhook, so
the secret never reaches the browser. See the root
[README](../../README.md#running-locally) for how to run it.
