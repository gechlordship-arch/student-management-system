const router = require('express').Router();
const { createStudent, listStudents, getStudent } = require('../controllers/studentController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

router.post('/', requireRole('admin'), createStudent);
router.get('/', requireRole('admin', 'teacher'), listStudents);
router.get('/:id', requireRole('admin', 'teacher', 'student'), getStudent);

module.exports = router;