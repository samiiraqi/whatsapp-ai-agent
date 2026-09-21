import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createSimulatorApp } from "./src/app.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(dirname, "../../.env") });

const app = createSimulatorApp({
  appServerUrl: process.env.APP_SERVER_URL || "http://127.0.0.1:3000",
  appSecret: process.env.WHATSAPP_APP_SECRET,
});

const port = process.env.SIMULATOR_PORT || 4000;

app.listen(port, "127.0.0.1", () => {
  console.log(`Simulator listening on http://127.0.0.1:${port}`);
});
