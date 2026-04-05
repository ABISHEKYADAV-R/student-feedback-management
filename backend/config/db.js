const mysql = require("mysql2");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const isLocal = process.env.DB_HOST === "localhost" || process.env.DB_HOST === "127.0.0.1";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "student_feedback_db",
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  connectTimeout: 20000,
  multipleStatements: true, 
  // Disable SSL for localhost, enable it for Railway
  ssl: isLocal ? false : { rejectUnauthorized: false }, 
});

const db = pool.promise();
module.exports = db;