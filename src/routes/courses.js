const router = require('express').Router();
const { createCourse, listCourses, getCourse, updateCourse, deleteCourse } = require('../controllers/courseController');
const { markAttendance, getCourseAttendance } = require('../controllers/attendanceController');
const { authenticate, requireRole } = require('../middleware/auth');
const { requireCourseTeacher } = require('../middleware/courseAccess');

router.use(authenticate);

// Course-scoped attendance (before /:id)
router.post(
  '/:courseId/attendance',
  requireRole('admin', 'teacher'),
  requireCourseTeacher,
  markAttendance
);
router.get(
  '/:courseId/attendance',
  requireRole('admin', 'teacher'),
  requireCourseTeacher,
  getCourseAttendance
);

// Course CRUD
router.post('/',      requireRole('admin'),                       createCourse);
router.get('/',       requireRole('admin', 'teacher', 'student'),  listCourses);
router.get('/:id',    requireRole('admin', 'teacher', 'student'),  getCourse);
router.put('/:id',    requireRole('admin'),                       updateCourse);
router.delete('/:id', requireRole('admin'),                       deleteCourse);

module.exports = router;