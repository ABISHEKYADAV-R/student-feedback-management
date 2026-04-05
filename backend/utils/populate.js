const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({path: path.join(__dirname, '..', '.env')});

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "student_feedback_db"
  });

  console.log("Populating dummy feedback data...");

  // Generate some past weeks' feedback for trends
  const comments = [
    "Great course!", "Needs more practical examples.", "The professor is amazing.", "I struggled with the assignments.",
    "Well structured.", "Lectures are a bit too fast.", "Awesome material.", "The exams were too hard.", 
    "Very engaging faculty.", "I didn't like the pacing."
  ];
  
  const facilityComments = [
    "Wi-Fi is too slow in the library.", "The mess food could be improved.", "Restrooms on the 2nd floor need frequent cleaning.",
    "Sports equipment is well maintained.", "Hostel rooms are quite clean.", "Campus buses are frequently delayed.",
    "Good parking space.", "Need more study spaces in the library.", "Great gym facilities!"
  ];

  const categories = ["Teaching Quality", "Course Material", "Lab Work", "Exam Difficulty", "Communication", "Other"];

  // Insert ~20 course feedbacks
  let createdCount = 0;
  for (let i = 0; i < 20; i++) {
    const courseId = Math.floor(Math.random() * 14) + 1; // 1 to 14
    const rating = Math.floor(Math.random() * 5) + 1;
    const comment = Math.random() > 0.3 ? comments[Math.floor(Math.random() * comments.length)] : null;
    const category = Math.random() > 0.2 ? categories[Math.floor(Math.random() * categories.length)] : null;
    
    // Random date within the last 60 days
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 60));
    const feedbackDate = date.toISOString().slice(0, 10);

    await db.query(
      "INSERT INTO feedback (course_id, facility_id, rating, comment, category, feedback_date) VALUES (?, NULL, ?, ?, ?, ?)",
      [courseId, rating, comment, category, feedbackDate]
    );
    createdCount++;
  }

  // Insert ~10 facility feedbacks
  for (let i = 0; i < 10; i++) {
    const facilityId = Math.floor(Math.random() * 7) + 1; // 1 to 7
    const rating = Math.floor(Math.random() * 5) + 1;
    const comment = Math.random() > 0.2 ? facilityComments[Math.floor(Math.random() * facilityComments.length)] : null;
    
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 60));
    const feedbackDate = date.toISOString().slice(0, 10);

    await db.query(
      "INSERT INTO feedback (course_id, facility_id, rating, comment, category, feedback_date) VALUES (NULL, ?, ?, ?, NULL, ?)",
      [facilityId, rating, comment, feedbackDate]
    );
    createdCount++;
  }

  // Insert 5 suggestions
  for (let i = 0; i < 5; i++) {
    const isCourse = Math.random() > 0.4;
    const courseId = isCourse ? Math.floor(Math.random() * 14) + 1 : null;
    const facilityId = !isCourse ? Math.floor(Math.random() * 7) + 1 : null;
    const text = isCourse ? "Please include more real world projects and workshops." : "Please extend the library hours until midnight during exams.";

    await db.query(
      "INSERT INTO suggestions (course_id, facility_id, suggestion) VALUES (?, ?, ?)",
      [courseId, facilityId, text]
    );
  }

  // Insert 3 actions
  const actionStatuses = ['pending', 'in-progress', 'resolved'];
  for (let i = 0; i < 2; i++) {
    const courseId = Math.floor(Math.random() * 14) + 1;
    const status = actionStatuses[Math.floor(Math.random() * actionStatuses.length)];
    await db.query(
      "INSERT INTO actions (course_id, facility_id, issue_description, action_taken, status) VALUES (?, NULL, 'Students reported issues with lab software.', 'IT department updated the software.', ?)",
      [courseId, status]
    );
  }
  
  for (let i = 0; i < 1; i++) {
    const facilityId = Math.floor(Math.random() * 7) + 1;
    const status = actionStatuses[Math.floor(Math.random() * actionStatuses.length)];
    await db.query(
      "INSERT INTO actions (course_id, facility_id, issue_description, action_taken, status) VALUES (NULL, ?, 'Facility needs maintenance.', 'Scheduled a contractor visit.', ?)",
      [facilityId, status]
    );
  }

  console.log(`Successfully injected ${createdCount} feedback reviews, and filled suggestions & actions!`);
  process.exit(0);
}
run().catch(console.error);
