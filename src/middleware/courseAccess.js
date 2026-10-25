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

// admin OR owning teacher OR enrolled student
const requireCourseAccess = async (req, res, next) => {
  const courseId = req.params.courseId || req.params.id;
  if (!courseId) return res.status(400).json({ error: 'Course id missing' });

  const { rows } = await db.query(
    'SELECT id, teacher_id FROM courses WHERE id = $1',
    [courseId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Course not found' });

  if (req.user.role === 'admin') return next();

  if (req.user.role === 'teacher') {
    if (rows[0].teacher_id !== req.user.profileId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
  }

  const enroll = await db.query(
    'SELECT 1 FROM enrollments WHERE course_id = $1 AND student_id = $2 LIMIT 1',
    [courseId, req.user.profileId]
  );
  if (enroll.rowCount === 0) return res.status(403).json({ error: 'Forbidden' });
  next();
};

// teacher must own the course the assessment belongs to
const requireAssessmentTeacher = async (req, res, next) => {
  if (req.user.role === 'admin') return next();
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { rows } = await db.query(
    `SELECT c.teacher_id
       FROM assessments a
       JOIN courses c ON c.id = a.course_id
      WHERE a.id = $1`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Assessment not found' });
  if (rows[0].teacher_id !== req.user.profileId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

module.exports = { requireCourseTeacher, requireCourseAccess, requireAssessmentTeacher };