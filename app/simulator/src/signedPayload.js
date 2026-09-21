import { sign } from "../../server/src/signature.js";

export function buildSignedPayload(phone, text, secret) {
  const payload = {
    entry: [
      {
        changes: [
          {
            value: {
              messages: [
                {
                  from: phone,
                  id: `sim-${Date.now()}`,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  type: "text",
                  text: { body: text },
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const body = JSON.stringify(payload);
  const signature = sign(body, secret);

  return { body, signature };
}
