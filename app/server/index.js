import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./src/app.js";
import { ConversationEngine } from "./src/engine.js";
import { MockBrain } from "./src/mockBrain.js";
import { ConversationStore } from "./src/store.js";
import { FakeMessageSender } from "./src/messageSender.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const business = JSON.parse(
  fs.readFileSync(path.join(dirname, "config/business.json"), "utf8")
);

const store = new ConversationStore(path.join(dirname, "data/conversations.db"));
const brain = new MockBrain(business);
const sender = new FakeMessageSender();
const engine = new ConversationEngine({ brain, store, sender });

const app = createApp({
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
  appSecret: process.env.WHATSAPP_APP_SECRET,
  onMessage: (message) => engine.handleMessage(message),
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
