// utils/seed.js - Creates default users with proper bcrypt-hashed passwords
// Run with: node utils/seed.js
const bcrypt = require("bcryptjs");
const db = require("../config/db");

async function seed() {
  console.log("Seeding default users...");

  const users = [
    {
      name: "Admin User",
      email: "admin@college.com",
      password: "admin123",
      role: "admin",
    },
    {
      name: "Dr. Smith",
      email: "smith@college.com",
      password: "faculty123",
      role: "faculty",
    },
    {
      name: "Dr. Johnson",
      email: "johnson@college.com",
      password: "faculty123",
      role: "faculty",
    },
    {
      name: "Alice Student",
      email: "alice@student.com",
      password: "student123",
      role: "student",
    },
    {
      name: "Bob Student",
      email: "bob@student.com",
      password: "student123",
      role: "student",
    },
  ];

  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 10);
    await db.query(
      `INSERT INTO users (name, email, password, role)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password = VALUES(password)`,
      [u.name, u.email, hashed, u.role],
    );
    console.log(
      `  ✅ ${u.role.padEnd(7)} | ${u.email.padEnd(25)} | password: ${u.password}`,
    );
  }

  console.log("\nDone! You can now log in with the credentials above.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
