const db = require('../config/db');

const createNotice = async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });

  const { rows } = await db.query(
    'INSERT INTO notices (title, content, created_by) VALUES ($1, $2, $3) RETURNING *',
    [title, content, req.user.userId]
  );
  res.status(201).json(rows[0]);
};

const getNotices = async (req, res) => {
  // Join with users to show the Admin's name
  const { rows } = await db.query(
    `SELECT n.*, u.first_name, u.last_name 
     FROM notices n 
     JOIN users u ON u.id = n.created_by 
     ORDER BY n.created_at DESC`
  );
  res.json(rows);
};

const deleteNotice = async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM notices WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Notice not found' });
  res.status(204).end();
};

module.exports = { createNotice, getNotices, deleteNotice };