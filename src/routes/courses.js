const router = require('express').Router();
const { createCourse, listCourses, getCourse, updateCourse, deleteCourse } = require('../controllers/courseController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

router.post('/',      requireRole('admin'),                       createCourse);
router.get('/',       requireRole('admin', 'teacher', 'student'),  listCourses);
router.get('/:id',    requireRole('admin', 'teacher', 'student'),  getCourse);
router.put('/:id',    requireRole('admin'),                       updateCourse);
router.delete('/:id', requireRole('admin'),                       deleteCourse);

module.exports = router;