const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { allocateQuota, getStudentCoordinators } = require('../controllers/staffController');

router.post('/allocate', protect, authorize('STAFF_COORDINATOR', 'ADMIN'), allocateQuota);
router.get('/students', protect, authorize('STAFF_COORDINATOR', 'HEAD_OFFICER', 'CHAMBER_BACK_OFFICER', 'ADMIN'), getStudentCoordinators);

module.exports = router;
