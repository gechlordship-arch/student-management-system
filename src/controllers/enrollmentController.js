const db = require('../config/db');

const enrollStudent = async (req, res) => {
  const { studentId, courseId } = req.body;
  if (!studentId || !courseId) {
    return res.status(400).json({ error: 'studentId and courseId required' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO enrollments (student_id, course_id)
       VALUES ($1, $2) RETURNING *`,
      [studentId, courseId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Student already enrolled in this course' });
    }
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Student or course does not exist' });
    }
    throw err;
  }
};

const listEnrollments = async (req, res) => {
  let query, params;

  if (req.user.role === 'admin') {
    query = `
      SELECT e.id, e.student_id, e.course_id, e.status, e.enrolled_at,
             s.student_number,
             u.first_name AS student_first, u.last_name AS student_last,
             c.course_code, c.name AS course_name
        FROM enrollments e
        JOIN students s ON s.id = e.student_id
        JOIN users u ON u.id = s.user_id
        JOIN courses c ON c.id = e.course_id
       ORDER BY c.course_code, u.last_name`;
    params = [];
  } else if (req.user.role === 'teacher') {
    query = `
      SELECT e.id, e.student_id, e.course_id, e.status, e.enrolled_at,
             s.student_number,
             u.first_name AS student_first, u.last_name AS student_last,
             c.course_code, c.name AS course_name
        FROM enrollments e
        JOIN students s ON s.id = e.student_id
        JOIN users u ON u.id = s.user_id
        JOIN courses c ON c.id = e.course_id
       WHERE c.teacher_id = $1
       ORDER BY c.course_code, u.last_name`;
    params = [req.user.profileId];
  } else {
    query = `
      SELECT e.id, e.course_id, e.status, e.enrolled_at,
             c.course_code, c.name AS course_name, c.credits,
             u.first_name AS teacher_first, u.last_name AS teacher_last
        FROM enrollments e
        JOIN courses c ON c.id = e.course_id
        LEFT JOIN teachers t ON t.id = c.teacher_id
        LEFT JOIN users u ON u.id = t.user_id
       WHERE e.student_id = $1
       ORDER BY c.course_code`;
    params = [req.user.profileId];
  }

  const { rows } = await db.query(query, params);
  res.json(rows);
};

// Here is the missing function that caused the crash!
const dropEnrollment = async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM enrollments WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Enrollment not found' });
  res.status(204).end();
};

module.exports = { enrollStudent, listEnrollments, dropEnrollment };