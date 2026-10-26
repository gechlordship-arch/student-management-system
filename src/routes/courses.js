const router = require('express').Router();
const { createCourse, listCourses, getCourse, updateCourse, deleteCourse } = require('../controllers/courseController');
const { markAttendance, getCourseAttendance, exportCourseAttendanceCSV } = require('../controllers/attendanceController');
const { createAssessment, listAssessments, getCourseGradebook } = require('../controllers/gradeController');
const { authenticate, requireRole } = require('../middleware/auth');
const { exportCourseGradesCSV } = require('../controllers/reportController');
const { requireCourseTeacher, requireCourseAccess } = require('../middleware/courseAccess');

router.use(authenticate);

// --- ATTENDANCE ROUTES ---
router.post('/:courseId/attendance', requireRole('admin', 'teacher'), requireCourseTeacher, markAttendance);
router.get('/:courseId/attendance', requireRole('admin', 'teacher'), requireCourseTeacher, getCourseAttendance); // <-- THIS WAS MISSING
router.get('/:courseId/attendance/csv', requireRole('admin', 'teacher'), requireCourseTeacher, exportCourseAttendanceCSV); // <-- NEW

// --- ASSESSMENT ROUTES ---
router.post('/:courseId/assessments', requireRole('admin', 'teacher'), requireCourseTeacher, createAssessment);
router.get('/:courseId/assessments', requireRole('admin', 'teacher', 'student'), requireCourseAccess, listAssessments);

// --- GRADEBOOK & EXPORT ROUTES ---
router.get('/:courseId/grades', requireRole('admin', 'teacher'), requireCourseTeacher, getCourseGradebook);
router.get('/:courseId/grades/csv', requireRole('admin', 'teacher'), requireCourseTeacher, exportCourseGradesCSV);

// --- COURSE CRUD ROUTES (Keep these at the bottom) ---
router.post('/',      requireRole('admin'),                       createCourse);
router.get('/',       requireRole('admin', 'teacher', 'student'),  listCourses);
router.get('/:id',    requireRole('admin', 'teacher', 'student'),  getCourse);
router.put('/:id',    requireRole('admin'),                       updateCourse);
router.delete('/:id', requireRole('admin'),                       deleteCourse);

module.exports = router;