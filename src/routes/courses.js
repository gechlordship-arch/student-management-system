const router = require('express').Router();
const { createCourse, listCourses, getCourse, updateCourse, deleteCourse } = require('../controllers/courseController');
const { markAttendance, getCourseAttendance } = require('../controllers/attendanceController');
const { createAssessment, listAssessments, getCourseGradebook } = require('../controllers/gradeController');
const { authenticate, requireRole } = require('../middleware/auth');
const { requireCourseTeacher, requireCourseAccess } = require('../middleware/courseAccess');

router.use(authenticate);

// Course-scoped attendance
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

// Course-scoped assessments
router.post(
  '/:courseId/assessments',
  requireRole('admin', 'teacher'),
  requireCourseTeacher,
  createAssessment
);
router.get(
  '/:courseId/assessments',
  requireRole('admin', 'teacher', 'student'),
  requireCourseAccess,
  listAssessments
);

// Full gradebook
router.get(
  '/:courseId/grades',
  requireRole('admin', 'teacher'),
  requireCourseTeacher,
  getCourseGradebook
);

// Course CRUD
router.post('/',      requireRole('admin'),                       createCourse);
router.get('/',       requireRole('admin', 'teacher', 'student'),  listCourses);
router.get('/:id',    requireRole('admin', 'teacher', 'student'),  getCourse);
router.put('/:id',    requireRole('admin'),                       updateCourse);
router.delete('/:id', requireRole('admin'),                       deleteCourse);

module.exports = router;