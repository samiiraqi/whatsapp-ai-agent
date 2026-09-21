// CrmAdapter interface: saveLead(lead) -> void

import Database from "better-sqlite3";

export class LocalCrm {
  constructor(dbPath = ":memory:") {
    this.db = new Database(dbPath);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        item TEXT NOT NULL,
        language TEXT NOT NULL,
        created_at TEXT NOT NULL,
        conversation_hash TEXT NOT NULL
      );
    `);
  }

  saveLead(lead) {
    this.db
      .prepare(
        `INSERT INTO leads (name, item, language, created_at, conversation_hash)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(
        lead.name,
        lead.item,
        lead.language,
        lead.createdAt,
        lead.conversationHash
      );
  }

  getLeads() {
    return this.db
      .prepare(
        `SELECT
           id,
           name,
           item,
           language,
           created_at AS createdAt,
           conversation_hash AS conversationHash
         FROM leads
         ORDER BY id`
      )
      .all();
  }

  close() {
    this.db.close();
  }
}
