// config/db.js - SQLite connection wrapper for mysql2 compatibility
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const fs = require("fs");

const dbPath = path.join(__dirname, "..", "database.sqlite");

// Initialize SQLite promise
let dbPromise = open({
  filename: dbPath,
  driver: sqlite3.Database
});

// Enable foreign keys
dbPromise.then(db => db.run("PRAGMA foreign_keys = ON"));

// Create a wrapper object matching the expected `db.execute(sql, params)` interface
const dbWrapper = {
  execute: async (sql, params = []) => {
    // MySQL query params with ? work identically to SQLite
    const db = await dbPromise;

    if (sql.trim().toUpperCase().startsWith("SELECT") || sql.trim().toUpperCase().startsWith("SHOW")) {
      const rows = await db.all(sql, params);
      return [rows]; // mimicking mysql2 [rows, fields] array
    } else {
      const result = await db.run(sql, params);
      // mimicking mysql2 [result] object containing insertId
      return [{ insertId: result.lastID, affectedRows: result.changes }];
    }
  },
  query: async function(sql, params = []) {
    return this.execute(sql, params);
  }
};

// Initialize schema on first run if needed
dbPromise.then(async (db) => {
  try {
    const tableExists = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
    if (!tableExists) {
      console.log("Initializing SQLite database from schema.sql...");
      const schemaSql = fs.readFileSync(path.join(__dirname, "..", "..", "database", "schema.sql"), "utf8");
      await db.exec(schemaSql);
      console.log("Database initialized successfully!");
    }
  } catch (err) {
    console.error("Database initialization failed:", err);
  }
});

module.exports = dbWrapper;
