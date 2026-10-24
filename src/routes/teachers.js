const router = require('express').Router();
const { createTeacher, listTeachers } = require('../controllers/teacherController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.post('/', requireRole('admin'), createTeacher);
router.get('/', requireRole('admin'), listTeachers);

module.exports = router;