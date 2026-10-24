const db = require('../config/db');

const createCourse = async (req, res) => {
  const { courseCode, name, description, credits, teacherId } = req.body;
  if (!courseCode || !name) {
    return res.status(400).json({ error: 'courseCode and name required' });
  }

  if (teacherId) {
    const t = await db.query('SELECT id FROM teachers WHERE id = $1', [teacherId]);
    if (!t.rows[0]) return res.status(400).json({ error: 'Teacher not found' });
  }

  const { rows } = await db.query(
    `INSERT INTO courses (course_code, name, description, credits, teacher_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [courseCode, name, description || null, credits || 3, teacherId || null]
  );
  res.status(201).json(rows[0]);
};

const listCourses = async (req, res) => {
  let query, params;

  if (req.user.role === 'admin') {
    query = `
      SELECT c.id, c.course_code, c.name, c.credits, c.teacher_id,
             u.first_name AS teacher_first, u.last_name AS teacher_last
        FROM courses c
        LEFT JOIN teachers t ON t.id = c.teacher_id
        LEFT JOIN users u ON u.id = t.user_id
       ORDER BY c.course_code`;
    params = [];
  } else if (req.user.role === 'teacher') {
    query = `
      SELECT c.id, c.course_code, c.name, c.credits, c.teacher_id
        FROM courses c
       WHERE c.teacher_id = $1
       ORDER BY c.course_code`;
    params = [req.user.profileId];
  } else {
    query = `
      SELECT c.id, c.course_code, c.name, c.credits, c.teacher_id
        FROM courses c
        JOIN enrollments e ON e.course_id = c.id
       WHERE e.student_id = $1
       ORDER BY c.course_code`;
    params = [req.user.profileId];
  }

  const { rows } = await db.query(query, params);
  res.json(rows);
};

const getCourse = async (req, res) => {
  const { rows } = await db.query('SELECT * FROM courses WHERE id = $1', [req.params.id]);
  const course = rows[0];
  if (!course) return res.status(404).json({ error: 'Course not found' });

  if (req.user.role === 'teacher' && course.teacher_id !== req.user.profileId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json(course);
};

const updateCourse = async (req, res) => {
  const { name, description, credits, teacherId } = req.body;
  const { rows } = await db.query(
    `UPDATE courses
        SET name = COALESCE($1, name),
            description = COALESCE($2, description),
            credits = COALESCE($3, credits),
            teacher_id = COALESCE($4, teacher_id)
      WHERE id = $5 RETURNING *`,
    [name, description, credits, teacherId, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Course not found' });
  res.json(rows[0]);
};

const deleteCourse = async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM courses WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Course not found' });
  res.status(204).end();
};

module.exports = { createCourse, listCourses, getCourse, updateCourse, deleteCourse };