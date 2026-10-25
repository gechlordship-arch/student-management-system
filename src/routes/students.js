const router = require('express').Router();
const { createStudent, listStudents, getStudent } = require('../controllers/studentController');
const { getStudentAttendance } = require('../controllers/attendanceController');
const { getStudentGrades } = require('../controllers/gradeController');
const { generateStudentReportCard } = require('../controllers/reportController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

// Sub-resources
router.get('/:id/attendance', requireRole('admin', 'teacher', 'student'), getStudentAttendance);
router.get('/:id/grades', requireRole('admin', 'teacher', 'student'), getStudentGrades);

// REPORT CARD (PDF)
router.get('/:id/report-card', requireRole('admin', 'teacher', 'student'), generateStudentReportCard);

// CRUD
router.post('/',    requireRole('admin'),                       createStudent);
router.get('/',     requireRole('admin', 'teacher'),            listStudents);
router.get('/:id',  requireRole('admin', 'teacher', 'student'), getStudent);

module.exports = router;