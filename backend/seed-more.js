// seed-more.js — Add Indian faculty names and more courses
const bcrypt = require("bcryptjs");
const db = require("./config/db");

async function seed() {
  const facultyPwd = await bcrypt.hash("faculty123", 10);
  const studentPwd = await bcrypt.hash("student123", 10);

  // ── Update existing faculty to Indian names ──
  await db.query(`UPDATE users SET name = 'Dr. Ramesh Kumar', email = 'ramesh@college.com' WHERE email = 'smith@college.com'`);
  await db.query(`UPDATE users SET name = 'Dr. Priya Sharma', email = 'priya@college.com' WHERE email = 'johnson@college.com'`);

  // ── Update existing students to Indian names ──
  await db.query(`UPDATE users SET name = 'Abishek Yadav' WHERE email = 'ram@student.com'`);
  await db.query(`UPDATE users SET name = 'Kavitha Meena' WHERE email = 'bob@student.com'`);

  // ── Add new faculty with Indian names ──
  const newFaculty = [
    ['Dr. Sunita Verma',     'sunita@college.com',     facultyPwd, 'faculty'],
    ['Prof. Arjun Reddy',    'arjun@college.com',      facultyPwd, 'faculty'],
    ['Dr. Lakshmi Iyer',     'lakshmi@college.com',    facultyPwd, 'faculty'],
    ['Prof. Vikram Singh',   'vikram@college.com',     facultyPwd, 'faculty'],
  ];

  for (const [name, email, pwd, role] of newFaculty) {
    const [existing] = await db.query(`SELECT user_id FROM users WHERE email = ?`, [email]);
    if (existing.length === 0) {
      await db.query(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`, [name, email, pwd, role]);
    }
  }

  // ── Add new students with Indian names ──
  const newStudents = [
    ['Deepak Patel',      'deepak@student.com',    studentPwd, 'student'],
    ['Ananya Krishnan',   'ananya@student.com',    studentPwd, 'student'],
    ['Rohit Nair',        'rohit@student.com',     studentPwd, 'student'],
    ['Sneha Gupta',       'sneha@student.com',     studentPwd, 'student'],
  ];

  for (const [name, email, pwd, role] of newStudents) {
    const [existing] = await db.query(`SELECT user_id FROM users WHERE email = ?`, [email]);
    if (existing.length === 0) {
      await db.query(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`, [name, email, pwd, role]);
    }
  }

  // ── Get faculty IDs ──
  const [allFaculty] = await db.query(`SELECT user_id, name FROM users WHERE role = 'faculty' ORDER BY user_id`);
  console.log("Faculty:", allFaculty.map(f => `${f.user_id}: ${f.name}`).join(", "));

  // Faculty ID map
  const fMap = {};
  for (const f of allFaculty) fMap[f.name] = f.user_id;

  // ── Add more courses ──
  const newCourses = [
    ['Operating Systems',              fMap['Dr. Sunita Verma']],
    ['Database Management Systems',    fMap['Dr. Sunita Verma']],
    ['Computer Networks',              fMap['Prof. Arjun Reddy']],
    ['Artificial Intelligence',        fMap['Prof. Arjun Reddy']],
    ['Software Engineering',           fMap['Dr. Lakshmi Iyer']],
    ['Cloud Computing',                fMap['Dr. Lakshmi Iyer']],
    ['Machine Learning',               fMap['Prof. Vikram Singh']],
    ['Cyber Security',                 fMap['Prof. Vikram Singh']],
    ['Discrete Mathematics',           fMap['Dr. Ramesh Kumar']],
    ['Digital Electronics',            fMap['Dr. Priya Sharma']],
  ];

  for (const [name, fid] of newCourses) {
    const [existing] = await db.query(`SELECT course_id FROM courses WHERE course_name = ?`, [name]);
    if (existing.length === 0) {
      await db.query(`INSERT INTO courses (course_name, faculty_id) VALUES (?, ?)`, [name, fid]);
    }
  }

  // ── Add sample feedback for new courses ──
  const [allCourses] = await db.query(`SELECT course_id, course_name FROM courses ORDER BY course_id`);
  console.log("Courses:", allCourses.map(c => `${c.course_id}: ${c.course_name}`).join(", "));

  const categories = ['Teaching Quality', 'Course Content', 'Lab & Practical', 'Assessment', 'Communication'];
  const comments = [
    'Excellent teaching methodology, very clear explanations.',
    'Good course content but needs more practical examples.',
    'The professor is very supportive and helpful.',
    'Assignments are well-structured and relevant.',
    'Could improve the pace of lectures.',
    'Lab sessions are very informative and hands-on.',
    'Great use of real-world case studies.',
    'More interactive sessions would be helpful.',
    'Very knowledgeable faculty, enjoyed the course.',
    'Course material is up to date with industry standards.',
    'Need more doubt-clearing sessions.',
    'Excellent problem-solving approach in class.',
    'The faculty makes complex topics easy to understand.',
    'Would appreciate more project-based learning.',
    'Very engaging lectures, never felt bored.',
  ];

  // Add 2-4 feedback entries per new course
  for (const course of allCourses) {
    const [existingFb] = await db.query(`SELECT COUNT(*) as cnt FROM feedback WHERE course_id = ?`, [course.course_id]);
    if (existingFb[0].cnt >= 3) continue; // skip if already has enough feedback

    const numFeedback = 2 + Math.floor(Math.random() * 3); // 2-4
    for (let i = 0; i < numFeedback; i++) {
      const rating = 3 + Math.floor(Math.random() * 3); // 3-5
      const comment = comments[Math.floor(Math.random() * comments.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      const feedbackDate = new Date(Date.now() - daysAgo * 86400000).toISOString().split('T')[0];

      await db.query(
        `INSERT INTO feedback (course_id, rating, comment, category, feedback_date) VALUES (?, ?, ?, ?, ?)`,
        [course.course_id, rating, comment, category, feedbackDate]
      );
    }
  }

  // ── Add sample suggestions ──
  const suggestions = [
    'Please include more hands-on coding assignments.',
    'Add video recordings of lectures for revision.',
    'Include guest lectures from industry professionals.',
    'Provide study materials before the class.',
    'Conduct weekly quizzes for better preparation.',
    'Add more group project opportunities.',
  ];

  for (const course of allCourses.slice(4, 10)) { // add suggestions to newer courses
    const [existingSg] = await db.query(`SELECT COUNT(*) as cnt FROM suggestions WHERE course_id = ?`, [course.course_id]);
    if (existingSg[0].cnt >= 1) continue;

    const sg = suggestions[Math.floor(Math.random() * suggestions.length)];
    await db.query(`INSERT INTO suggestions (course_id, suggestion) VALUES (?, ?)`, [course.course_id, sg]);
  }

  // ── Add sample actions ──
  const actions = [
    { issue: 'Students reported lack of practical sessions', action: 'Added 2 extra lab hours per week', status: 'resolved' },
    { issue: 'Slow pace of lectures reported', action: 'Faculty to provide pre-read materials', status: 'in-progress' },
    { issue: 'Need for doubt-clearing sessions', action: 'Weekly office hours scheduled every Friday', status: 'resolved' },
    { issue: 'Outdated course materials', action: 'Course syllabus updated with latest references', status: 'pending' },
  ];

  const [existingActions] = await db.query(`SELECT COUNT(*) as cnt FROM actions`);
  if (existingActions[0].cnt < 3) {
    for (let i = 0; i < actions.length; i++) {
      const cid = allCourses[i % allCourses.length].course_id;
      await db.query(
        `INSERT INTO actions (course_id, issue_description, action_taken, status) VALUES (?, ?, ?, ?)`,
        [cid, actions[i].issue, actions[i].action, actions[i].status]
      );
    }
  }

  console.log("✅ Seeding complete!");
  process.exit(0);
}

seed().catch(err => { console.error("Seed error:", err); process.exit(1); });
