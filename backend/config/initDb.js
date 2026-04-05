const db = require("./db");
const fs = require("fs").promises;
const path = require("path");

async function initDb() {
  try {
    const [rows] = await db.query("SHOW TABLES LIKE 'users'");
    if (rows.length === 0) {
      console.log("🛠️ Database is empty. Running schema.sql...");
      const schemaPath = path.join(
        __dirname,
        "..",
        "..",
        "database",
        "schema.sql",
      );
      const sqlContent = await fs.readFile(schemaPath, "utf-8");
      await db.query(sqlContent);
      console.log("✅ Database successfully initialized on Vercel.");
    } else {
      console.log("✅ Database already initialized.");
    }
  } catch (err) {
    console.error("❌ Database initialization error:", err.message);
    throw err;
  }
}

module.exports = initDb;
