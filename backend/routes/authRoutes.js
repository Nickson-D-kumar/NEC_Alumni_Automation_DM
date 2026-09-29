const express = require('express');
const router = express.Router();
const { studentRegister, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Support all route variations to prevent any 404 route mismatches
router.post('/student-register', studentRegister);
router.post('/register', studentRegister);
router.post('/auth/student-register', studentRegister);
router.post('/auth/register', studentRegister);
router.post('/', studentRegister);

router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;
