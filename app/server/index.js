import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createApp } from "./src/app.js";
import { ConversationEngine } from "./src/engine.js";
import { MockBrain } from "./src/mockBrain.js";
import { ConversationStore } from "./src/store.js";
import { FakeMessageSender } from "./src/messageSender.js";
import { LocalCrm } from "./src/localCrm.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(dirname, "../../.env") });

const business = JSON.parse(
  fs.readFileSync(path.join(dirname, "config/business.json"), "utf8")
);

const dbPath = path.join(dirname, "data/conversations.db");
const store = new ConversationStore(dbPath);
const crm = new LocalCrm(dbPath);
const brain = new MockBrain(business);
const sender = new FakeMessageSender();
const engine = new ConversationEngine({ brain, store, sender, crm });

const app = createApp({
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
  appSecret: process.env.WHATSAPP_APP_SECRET,
  onMessage: (message) => engine.handleMessage(message),
  devSimulator: process.env.DEV_SIMULATOR === "true",
  sender,
  store,
  crm,
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
