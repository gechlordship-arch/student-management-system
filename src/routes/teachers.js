const router = require('express').Router();
const { createTeacher, listTeachers, updateTeacher, deleteTeacher } = require('../controllers/teacherController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.post('/', requireRole('admin'), createTeacher);
router.get('/', requireRole('admin'), listTeachers);
router.put('/:id', requireRole('admin'), updateTeacher);       // <-- NEW
router.delete('/:id', requireRole('admin'), deleteTeacher);    // <-- NEW

module.exports = router;