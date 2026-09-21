export function extractTextMessages(payload) {
  const messages = [];
  const entries = payload?.entry ?? [];

  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      for (const raw of change.value?.messages ?? []) {
        if (raw.type === "text" && raw.text?.body) {
          messages.push({
            from: raw.from,
            id: raw.id,
            timestamp: raw.timestamp,
            text: raw.text.body,
          });
        }
      }
    }
  }

  return messages;
}
