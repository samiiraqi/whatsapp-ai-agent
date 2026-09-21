import { describe, it, expect } from "vitest";
import { buildSignedPayload } from "../src/signedPayload.js";
import { isValidSignature } from "../../server/src/signature.js";

describe("buildSignedPayload", () => {
  it("produces a signature the webhook accepts", () => {
    const { body, signature } = buildSignedPayload(
      "15551234567",
      "Hello",
      "test-secret"
    );

    expect(isValidSignature(Buffer.from(body), signature, "test-secret")).toBe(
      true
    );
  });

  it("produces a signature the webhook rejects with the wrong secret", () => {
    const { body, signature } = buildSignedPayload(
      "15551234567",
      "Hello",
      "test-secret"
    );

    expect(
      isValidSignature(Buffer.from(body), signature, "other-secret")
    ).toBe(false);
  });

  it("embeds the phone number and text in a standard WhatsApp payload shape", () => {
    const { body } = buildSignedPayload("15551234567", "Hello", "secret");
    const parsed = JSON.parse(body);

    expect(parsed.entry[0].changes[0].value.messages[0]).toMatchObject({
      from: "15551234567",
      type: "text",
      text: { body: "Hello" },
    });
  });
});
