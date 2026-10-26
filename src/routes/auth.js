const { login, me, changePassword, forgotPassword, resetPassword } = require('../controllers/authController');
const router = require('express').Router();
// 1. Add changePassword to the import here
const { authenticate } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', authenticate, me);

// 2. Add the new route here, right above module.exports
router.put('/password', authenticate, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;