const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];
  if (!user || !user.is_active) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  let profileId = null;
  if (user.role === 'student') {
    const r = await db.query('SELECT id FROM students WHERE user_id = $1', [user.id]);
    profileId = r.rows[0]?.id ?? null;
  } else if (user.role === 'teacher') {
    const r = await db.query('SELECT id FROM teachers WHERE user_id = $1', [user.id]);
    profileId = r.rows[0]?.id ?? null;
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role, profileId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
    },
  });
};

const me = async (req, res) => {
  const { rows } = await db.query(
    'SELECT id, email, role, first_name, last_name FROM users WHERE id = $1',
    [req.user.userId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
};

module.exports = { login, me };