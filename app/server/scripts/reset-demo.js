import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to reset demo data: NODE_ENV=production");
  process.exit(1);
}

const dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(dirname, "../data/conversations.db");

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log(`Deleted ${dbPath}`);
} else {
  console.log(`No database file at ${dbPath}, nothing to do`);
}
