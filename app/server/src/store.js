import Database from "better-sqlite3";
import crypto from "node:crypto";

export function hashPhone(phone) {
  return crypto.createHash("sha256").update(phone).digest("hex");
}

export class ConversationStore {
  constructor(dbPath = ":memory:") {
    this.db = new Database(dbPath);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        phone_hash TEXT PRIMARY KEY,
        handoff INTEGER NOT NULL DEFAULT 0,
        flow_state TEXT
      );
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone_hash TEXT NOT NULL,
        direction TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
  }

  addMessage(phone, direction, text) {
    const phoneHash = hashPhone(phone);
    this.db
      .prepare(
        "INSERT OR IGNORE INTO conversations (phone_hash, handoff) VALUES (?, 0)"
      )
      .run(phoneHash);
    this.db
      .prepare(
        "INSERT INTO messages (phone_hash, direction, text, created_at) VALUES (?, ?, ?, ?)"
      )
      .run(phoneHash, direction, text, new Date().toISOString());
  }

  setHandoff(phone, handoff) {
    const phoneHash = hashPhone(phone);
    this.db
      .prepare(
        `INSERT INTO conversations (phone_hash, handoff) VALUES (?, ?)
         ON CONFLICT(phone_hash) DO UPDATE SET handoff = excluded.handoff`
      )
      .run(phoneHash, handoff ? 1 : 0);
  }

  isHandoff(phone) {
    const row = this.db
      .prepare("SELECT handoff FROM conversations WHERE phone_hash = ?")
      .get(hashPhone(phone));
    return Boolean(row?.handoff);
  }

  getFlowState(phone) {
    const row = this.db
      .prepare("SELECT flow_state FROM conversations WHERE phone_hash = ?")
      .get(hashPhone(phone));
    return row?.flow_state ? JSON.parse(row.flow_state) : null;
  }

  setFlowState(phone, state) {
    const phoneHash = hashPhone(phone);
    const json = state ? JSON.stringify(state) : null;
    this.db
      .prepare(
        `INSERT INTO conversations (phone_hash, handoff, flow_state) VALUES (?, 0, ?)
         ON CONFLICT(phone_hash) DO UPDATE SET flow_state = excluded.flow_state`
      )
      .run(phoneHash, json);
  }

  getMessages(phone) {
    return this.db
      .prepare(
        "SELECT direction, text, created_at FROM messages WHERE phone_hash = ? ORDER BY id"
      )
      .all(hashPhone(phone));
  }

  close() {
    this.db.close();
  }
}
