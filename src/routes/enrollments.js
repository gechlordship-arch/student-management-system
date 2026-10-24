const router = require('express').Router();
const { enrollStudent, listEnrollments, dropEnrollment } = require('../controllers/enrollmentController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

router.post('/',      requireRole('admin'),                       enrollStudent);
router.get('/',       requireRole('admin', 'teacher', 'student'), listEnrollments);
router.delete('/:id', requireRole('admin'),                       dropEnrollment);

module.exports = router;