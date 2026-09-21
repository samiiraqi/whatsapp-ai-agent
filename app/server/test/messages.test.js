import { describe, it, expect } from "vitest";
import { extractTextMessages } from "../src/messages.js";

describe("extractTextMessages", () => {
  it("extracts text messages from a standard WhatsApp payload", () => {
    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    from: "15551234567",
                    id: "wamid.1",
                    timestamp: "1700000000",
                    type: "text",
                    text: { body: "Hi there" },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    expect(extractTextMessages(payload)).toEqual([
      {
        from: "15551234567",
        id: "wamid.1",
        timestamp: "1700000000",
        text: "Hi there",
      },
    ]);
  });

  it("ignores non-text messages and missing fields", () => {
    const payload = {
      entry: [
        { changes: [{ value: { messages: [{ type: "image" }] } }] },
        { changes: [{ value: {} }] },
        {},
      ],
    };

    expect(extractTextMessages(payload)).toEqual([]);
  });
});
