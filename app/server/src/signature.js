import crypto from "node:crypto";

export function sign(rawBody, secret) {
  return (
    "sha256=" +
    crypto.createHmac("sha256", secret).update(rawBody).digest("hex")
  );
}

export function isValidSignature(rawBody, header, secret) {
  if (!header || !rawBody || !secret) return false;

  const expected = sign(rawBody, secret);

  const expectedBuf = Buffer.from(expected, "utf8");
  const receivedBuf = Buffer.from(header, "utf8");

  if (expectedBuf.length !== receivedBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}
