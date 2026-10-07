const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { 
  allocateQuota, 
  getStudentCoordinators,
  sendInitiativeMail,
  getCoordinatorActivityMetrics,
  sendInitiativeReminder
} = require('../controllers/staffController');

router.post('/allocate', protect, authorize('STAFF_COORDINATOR', 'ADMIN'), allocateQuota);
router.get('/students', protect, authorize('STAFF_COORDINATOR', 'HEAD_OFFICER', 'CHAMBER_BACK_OFFICER', 'ADMIN'), getStudentCoordinators);

// Student Initiative Notification Email Dispatch (Staff Authority)
router.post('/student-coordinators/:studentId/send-initiative-mail', protect, authorize('STAFF_COORDINATOR', 'ADMIN'), sendInitiativeMail);
router.post('/send-initiative-mail', protect, authorize('STAFF_COORDINATOR', 'ADMIN'), sendInitiativeMail);

// Student Coordinator Activity Monitor & Actionable Inactivity Reminder
router.get('/coordinators/activity', protect, authorize('STAFF_COORDINATOR', 'ADMIN'), getCoordinatorActivityMetrics);
router.get('/inactive-students', protect, authorize('STAFF_COORDINATOR', 'ADMIN'), getCoordinatorActivityMetrics);
router.post('/coordinators/:studentId/remind-initiative', protect, authorize('STAFF_COORDINATOR', 'ADMIN'), sendInitiativeReminder);
router.post('/remind-initiative', protect, authorize('STAFF_COORDINATOR', 'ADMIN'), sendInitiativeReminder);

module.exports = router;
