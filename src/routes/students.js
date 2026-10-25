const router = require('express').Router();
const { createStudent, listStudents, getStudent } = require('../controllers/studentController');
const { getStudentAttendance } = require('../controllers/attendanceController');
const { getStudentGrades } = require('../controllers/gradeController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

// Student-scoped sub-resources (before /:id)
router.get(
  '/:id/attendance',
  requireRole('admin', 'teacher', 'student'),
  getStudentAttendance
);
router.get(
  '/:id/grades',
  requireRole('admin', 'teacher', 'student'),
  getStudentGrades
);

// Student CRUD
router.post('/',    requireRole('admin'),                       createStudent);
router.get('/',     requireRole('admin', 'teacher'),            listStudents);
router.get('/:id',  requireRole('admin', 'teacher', 'student'), getStudent);

module.exports = router;