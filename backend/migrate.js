// migrate.js - Add category column and feedback_tracking table
const db = require("./config/db");

async function migrate() {
  try {
    // Add category column to feedback table
    try {
      await db.query("ALTER TABLE feedback ADD COLUMN category VARCHAR(50) DEFAULT NULL");
      console.log("✅ Added 'category' column to feedback table");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log("⏭️  'category' column already exists, skipping");
      } else {
        throw e;
      }
    }

    // Create feedback_tracking table for duplicate prevention
    await db.query(`
      CREATE TABLE IF NOT EXISTS feedback_tracking (
        tracking_id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        course_id INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_student_course (student_id, course_id),
        FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
      )
    `);
    console.log("✅ Created 'feedback_tracking' table");

    console.log("\n🎉 Migration complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  }
}

migrate();
