const bcrypt = require('bcryptjs');
const db = require('../config/db');

const createTeacher = async (req, res) => {
  const { email, password, firstName, lastName, employeeId, department, hireDate } = req.body;
  if (!email || !password || !firstName || !lastName || !employeeId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const hash = await bcrypt.hash(password, 10);
    const userRes = await client.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name)
       VALUES ($1, $2, 'teacher', $3, $4) RETURNING id`,
      [email, hash, firstName, lastName]
    );

    const teacherRes = await client.query(
      `INSERT INTO teachers (user_id, employee_id, department, hire_date)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userRes.rows[0].id, employeeId, department || null, hireDate || null]
    );

    await client.query('COMMIT');

    res.status(201).json({
      id: teacherRes.rows[0].id,
      userId: userRes.rows[0].id,
      employeeId,
      email,
      firstName,
      lastName,
      department: department || null,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email or employee ID already exists' });
    }
    throw err;
  } finally {
    client.release();
  }
};

const listTeachers = async (req, res) => {
  const { rows } = await db.query(
    `SELECT t.id, t.employee_id, t.department, t.hire_date,
            u.first_name, u.last_name, u.email
       FROM teachers t
       JOIN users u ON u.id = t.user_id
      ORDER BY u.last_name, u.first_name`
  );
  res.json(rows);
};
const updateTeacher = async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, employeeId, department } = req.body;
  
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name), email = COALESCE($3, email)
       WHERE id = (SELECT user_id FROM teachers WHERE id = $4)`,
      [firstName, lastName, email, id]
    );
    const { rows } = await client.query(
      `UPDATE teachers SET employee_id = COALESCE($1, employee_id), department = COALESCE($2, department) WHERE id = $3 RETURNING *`,
      [employeeId, department, id]
    );
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to update teacher' });
  } finally {
    client.release();
  }
};

const deleteTeacher = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(`DELETE FROM users WHERE id = (SELECT user_id FROM teachers WHERE id = $1)`, [id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete teacher' });
  }
};
module.exports = { createTeacher, listTeachers ,updateTeacher, deleteTeacher };