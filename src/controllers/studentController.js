const bcrypt = require('bcryptjs');
const db = require('../config/db');

const createStudent = async (req, res) => {
  const { email, password, firstName, lastName, studentNumber, dateOfBirth } = req.body;
  if (!email || !password || !firstName || !lastName || !studentNumber) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const hash = await bcrypt.hash(password, 10);
    const userRes = await client.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name)
       VALUES ($1, $2, 'student', $3, $4) RETURNING id`,
      [email, hash, firstName, lastName]
    );
    const studentRes = await client.query(
      `INSERT INTO students (user_id, student_number, date_of_birth) VALUES ($1, $2, $3) RETURNING *`,
      [userRes.rows[0].id, studentNumber, dateOfBirth || null]
    );
    await client.query('COMMIT');
    res.status(201).json({ id: studentRes.rows[0].id, userId: userRes.rows[0].id, studentNumber, email, firstName, lastName });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(409).json({ error: 'Email or student number already exists' });
    throw err;
  } finally {
    client.release();
  }
};

// UPDATED: Backend Pagination & Search
const listStudents = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const search = req.query.search || '';
  const offset = (page - 1) * limit;
  const searchQuery = `%${search}%`;

  try {
    const { rows } = await db.query(
      `SELECT s.id, s.student_number, s.status, s.enrollment_date,
              u.first_name, u.last_name, u.email
         FROM students s
         JOIN users u ON u.id = s.user_id
        WHERE u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR s.student_number ILIKE $1
        ORDER BY u.last_name, u.first_name
        LIMIT $2 OFFSET $3`,
      [searchQuery, limit, offset]
    );

    const countRes = await db.query(
      `SELECT COUNT(*) FROM students s 
         JOIN users u ON u.id = s.user_id
        WHERE u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR s.student_number ILIKE $1`,
      [searchQuery]
    );

    res.json({
      data: rows,
      total: parseInt(countRes.rows[0].count),
      page,
      totalPages: Math.ceil(parseInt(countRes.rows[0].count) / limit)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

const getStudent = async (req, res) => {
  const { id } = req.params;
  if (req.user.role === 'student' && req.user.profileId !== Number(id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { rows } = await db.query(
    `SELECT s.id, s.student_number, s.status, s.enrollment_date, s.date_of_birth,
            u.first_name, u.last_name, u.email
       FROM students s JOIN users u ON u.id = s.user_id WHERE s.id = $1`, [id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Student not found' });
  res.json(rows[0]);
};

const updateStudent = async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, studentNumber } = req.body;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name), email = COALESCE($3, email)
       WHERE id = (SELECT user_id FROM students WHERE id = $4)`, [firstName, lastName, email, id]
    );
    const { rows } = await client.query(
      `UPDATE students SET student_number = COALESCE($1, student_number) WHERE id = $2 RETURNING *`, [studentNumber, id]
    );
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to update student' });
  } finally { client.release(); }
};

const deleteStudent = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(`DELETE FROM users WHERE id = (SELECT user_id FROM students WHERE id = $1)`, [id]);
    res.status(204).send();
  } catch (err) { res.status(500).json({ error: 'Failed to delete student' }); }
};

module.exports = { createStudent, listStudents, getStudent, updateStudent, deleteStudent };