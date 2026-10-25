const router = require('express').Router();
const { enterGrades, deleteAssessment } = require('../controllers/gradeController');
const { authenticate, requireRole } = require('../middleware/auth');
const { requireAssessmentTeacher } = require('../middleware/courseAccess');

router.use(authenticate);

router.post('/:id/grades', requireRole('admin', 'teacher'), requireAssessmentTeacher, enterGrades);
router.delete('/:id',       requireRole('admin', 'teacher'), requireAssessmentTeacher, deleteAssessment);

module.exports = router;