// config/initDb.js
const db = require("./db");

async function initDb() {
  // The database initialization (schema and seeding) is now handled automatically by config/db.js on first boot.
  // We do a quick check here to ensure the connection is active.
  try {
    await db.query("SELECT 1");
    console.log("✅ Database ready.");
  } catch (e) {
    throw new Error("Failed to connect to SQLite database: " + e.message);
  }
}

module.exports = initDb;
