const router = require('express').Router();
const { createNotice, getNotices, deleteNotice } = require('../controllers/noticeController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

router.post('/', requireRole('admin'), createNotice);
router.get('/', getNotices); // Everyone can read
router.delete('/:id', requireRole('admin'), deleteNotice);

module.exports = router;