const db = require('../config/db');

const requireCourseTeacher = async (req, res, next) => {
  if (req.user.role === 'admin') return next();
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const courseId = req.params.courseId || req.params.id;
  if (!courseId) return res.status(400).json({ error: 'Course id missing' });

  const { rows } = await db.query(
    'SELECT teacher_id FROM courses WHERE id = $1',
    [courseId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Course not found' });
  if (rows[0].teacher_id !== req.user.profileId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
};

module.exports = { requireCourseTeacher };