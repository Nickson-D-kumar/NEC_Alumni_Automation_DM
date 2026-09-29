const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { verifyBackOfficer, sendReminder, getInactiveStudents } = require('../controllers/officerController');

// Back Officer Verification Endpoint
router.post('/verify/:id', protect, authorize('CHAMBER_BACK_OFFICER', 'BACK_OFFICER', 'BACKOFFICE', 'HEAD_OFFICER', 'ADMIN'), verifyBackOfficer);
router.put('/verify/:id', protect, authorize('CHAMBER_BACK_OFFICER', 'BACK_OFFICER', 'BACKOFFICE', 'HEAD_OFFICER', 'ADMIN'), verifyBackOfficer);

// Head Officer Portal Endpoints
router.post('/send-reminder', protect, authorize('HEAD_OFFICER', 'ADMIN'), sendReminder);
router.get('/inactive-students', protect, authorize('HEAD_OFFICER', 'STAFF_COORDINATOR', 'ADMIN'), getInactiveStudents);

module.exports = router;
