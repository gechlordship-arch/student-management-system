const crypto = require('crypto');
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
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password required' });
  }

  const { rows } = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.userId]);
  const user = rows[0];

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Incorrect current password' });
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.userId]);
  
  res.json({ message: 'Password updated successfully' });
};
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  
  if (!rows[0]) return res.status(404).json({ error: 'User not found' });

  // Generate a 6-character reset code (e.g., A1B2C3)
  const token = crypto.randomBytes(3).toString('hex').toUpperCase();
  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins from now

  await db.query('UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3', [token, expiry, email]);
  
  // SIMULATE EMAIL: Print to the backend terminal!
  console.log(`\n=========================================`);
  console.log(`✉️ PASSWORD RESET EMAIL SENT TO: ${email}`);
  console.log(`🔑 YOUR RESET CODE IS: ${token}`);
  console.log(`=========================================\n`);
  
  res.json({ message: 'Reset code sent! Check the backend terminal.' });
};

const resetPassword = async (req, res) => {
  const { email, token, newPassword } = req.body;
  
  const { rows } = await db.query(
    'SELECT * FROM users WHERE email = $1 AND reset_token = $2 AND reset_token_expiry > NOW()', 
    [email, token]
  );
  
  if (!rows[0]) return res.status(400).json({ error: 'Invalid or expired reset code' });

  const hash = await bcrypt.hash(newPassword, 10);
  await db.query('UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2', [hash, rows[0].id]);
  
  res.json({ message: 'Password reset successful! You can now log in.' });
};


module.exports = { login, me, changePassword, forgotPassword, resetPassword };