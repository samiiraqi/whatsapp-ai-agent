import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSignedPayload } from "./signedPayload.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultPublicDir = path.join(dirname, "../public");

export function createSimulatorApp({
  appServerUrl,
  appSecret,
  publicDir = defaultPublicDir,
}) {
  const app = express();

  app.use(express.json());
  app.use(express.static(publicDir));

  app.post("/send", async (req, res) => {
    const { phone, text } = req.body ?? {};
    if (!phone || !text) {
      return res.status(400).json({ error: "phone and text are required" });
    }

    const { body, signature } = buildSignedPayload(phone, text, appSecret);

    let response;
    try {
      response = await fetch(`${appServerUrl}/webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Hub-Signature-256": signature,
        },
        body,
      });
    } catch {
      return res.status(503).json({ error: "Server is not running" });
    }

    res.sendStatus(response.status);
  });

  app.get("/outbox", async (req, res) => {
    let response;
    try {
      response = await fetch(`${appServerUrl}/dev/outbox`);
    } catch {
      return res.status(503).json({ error: "Server is not running" });
    }

    if (!response.ok) {
      return res.status(response.status).json({ messages: [] });
    }
    res.json(await response.json());
  });

  return app;
}
