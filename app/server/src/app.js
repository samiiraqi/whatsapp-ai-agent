import express from "express";
import { isValidSignature } from "./signature.js";
import { extractTextMessages } from "./messages.js";

export function createApp({ verifyToken, appSecret, onMessage }) {
  const app = express();

  app.get("/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === verifyToken) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  });

  app.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    (req, res) => {
      const signature = req.get("X-Hub-Signature-256");

      if (!isValidSignature(req.body, signature, appSecret)) {
        return res.sendStatus(401);
      }

      res.sendStatus(200);

      let payload;
      try {
        payload = JSON.parse(req.body.toString("utf8"));
      } catch {
        return;
      }

      for (const message of extractTextMessages(payload)) {
        onMessage?.(message);
      }
    }
  );

  return app;
}
