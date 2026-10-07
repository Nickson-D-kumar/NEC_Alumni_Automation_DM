const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { 
  verifyBackOfficer, 
  sendReminder, 
  getInactiveStudents, 
  getAlumniDiff, 
  requestStudentRevision,
  rejectVerification
} = require('../controllers/officerController');

// Back Officer Verification & Diff Endpoints
router.get('/alumni/:id/diff', protect, authorize('CHAMBER_BACK_OFFICER', 'BACK_OFFICER', 'BACKOFFICE', 'HEAD_OFFICER', 'ADMIN'), getAlumniDiff);
router.get('/:id/diff', protect, authorize('CHAMBER_BACK_OFFICER', 'BACK_OFFICER', 'BACKOFFICE', 'HEAD_OFFICER', 'ADMIN'), getAlumniDiff);

router.post('/alumni/:id/verify', protect, authorize('CHAMBER_BACK_OFFICER', 'BACK_OFFICER', 'BACKOFFICE', 'HEAD_OFFICER', 'ADMIN'), verifyBackOfficer);
router.put('/alumni/:id/verify', protect, authorize('CHAMBER_BACK_OFFICER', 'BACK_OFFICER', 'BACKOFFICE', 'HEAD_OFFICER', 'ADMIN'), verifyBackOfficer);
router.post('/verify/:id', protect, authorize('CHAMBER_BACK_OFFICER', 'BACK_OFFICER', 'BACKOFFICE', 'HEAD_OFFICER', 'ADMIN'), verifyBackOfficer);
router.put('/verify/:id', protect, authorize('CHAMBER_BACK_OFFICER', 'BACK_OFFICER', 'BACKOFFICE', 'HEAD_OFFICER', 'ADMIN'), verifyBackOfficer);

router.post('/alumni/:id/request-revision', protect, authorize('CHAMBER_BACK_OFFICER', 'BACK_OFFICER', 'BACKOFFICE', 'HEAD_OFFICER', 'ADMIN'), requestStudentRevision);
router.post('/:id/request-revision', protect, authorize('CHAMBER_BACK_OFFICER', 'BACK_OFFICER', 'BACKOFFICE', 'HEAD_OFFICER', 'ADMIN'), requestStudentRevision);

router.post('/alumni/:id/reject', protect, authorize('CHAMBER_BACK_OFFICER', 'BACK_OFFICER', 'BACKOFFICE', 'HEAD_OFFICER', 'ADMIN'), rejectVerification);
router.post('/:id/reject', protect, authorize('CHAMBER_BACK_OFFICER', 'BACK_OFFICER', 'BACKOFFICE', 'HEAD_OFFICER', 'ADMIN'), rejectVerification);

// Head Officer Portal Endpoints
router.post('/send-reminder', protect, authorize('HEAD_OFFICER', 'ADMIN'), sendReminder);
router.get('/inactive-students', protect, authorize('HEAD_OFFICER', 'STAFF_COORDINATOR', 'ADMIN'), getInactiveStudents);

module.exports = router;
