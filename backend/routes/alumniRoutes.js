const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { 
  getAlumni, 
  getAlumniById, 
  logCall, 
  updateData, 
  addRemark, 
  inspectAlumni,
  addRemarkPost,
  getStudentRemarks,
  getMonthlyTracking,
  updateMonthlyTracking,
  getStudentWallet,
  requestChequePayout,
  getStats 
} = require('../controllers/alumniController');
const { verifyBackOfficer, getAlumniDiff, rejectVerification } = require('../controllers/officerController');
const { adminApprove } = require('../controllers/adminController');
const { handleEscalation } = require('../controllers/staffController');

router.get('/stats', protect, getStats);
router.get('/monthly-tracking', protect, getMonthlyTracking);
router.patch('/monthly-tracking', protect, updateMonthlyTracking);
router.patch('/alumni-tracking', protect, updateMonthlyTracking);

// Student Wallet & Payout Endpoints
router.get('/wallet', protect, getStudentWallet);
router.post('/request-cheque-payout', protect, requestChequePayout);

router.get('/', protect, getAlumni);

// Two-Way Inspection & Remarks Endpoints
router.get('/:id/diff', protect, authorize('CHAMBER_BACK_OFFICER', 'BACK_OFFICER', 'BACKOFFICE', 'HEAD_OFFICER', 'ADMIN'), getAlumniDiff);
router.get('/:id/inspect', protect, authorize('CHAMBER_BACK_OFFICER', 'HEAD_OFFICER', 'ADMIN'), inspectAlumni);
router.post('/:id/add-remark', protect, authorize('CHAMBER_BACK_OFFICER', 'HEAD_OFFICER', 'ADMIN'), addRemarkPost);
router.get('/:id/student-remarks', protect, authorize('STUDENT_COORDINATOR'), getStudentRemarks);

router.get('/:id', protect, getAlumniById);

// Record Verification Responsibility Transferred to Back Officer (and Admin)
router.put('/:id/verify-back-officer', protect, authorize('CHAMBER_BACK_OFFICER', 'BACK_OFFICER', 'BACKOFFICE', 'HEAD_OFFICER', 'ADMIN'), verifyBackOfficer);
router.post('/:id/verify-back-officer', protect, authorize('CHAMBER_BACK_OFFICER', 'BACK_OFFICER', 'BACKOFFICE', 'HEAD_OFFICER', 'ADMIN'), verifyBackOfficer);
router.post('/:id/reject', protect, authorize('CHAMBER_BACK_OFFICER', 'BACK_OFFICER', 'BACKOFFICE', 'HEAD_OFFICER', 'ADMIN'), rejectVerification);
router.put('/:id/verify-head', protect, authorize('CHAMBER_BACK_OFFICER', 'BACK_OFFICER', 'BACKOFFICE', 'HEAD_OFFICER', 'ADMIN'), verifyBackOfficer);
router.put('/:id/head-verify', protect, authorize('CHAMBER_BACK_OFFICER', 'BACK_OFFICER', 'BACKOFFICE', 'HEAD_OFFICER', 'ADMIN'), verifyBackOfficer);

// Student Verification & Data Update Endpoints
router.post('/:id/log-call', protect, authorize('STUDENT_COORDINATOR', 'ADMIN'), logCall);
router.put('/:id/update-data', protect, authorize('STUDENT_COORDINATOR', 'ADMIN'), updateData);
router.patch('/:id', protect, authorize('STUDENT_COORDINATOR', 'ADMIN'), updateData);
router.put('/:id/verify', protect, authorize('STUDENT_COORDINATOR', 'ADMIN'), updateData);
router.put('/:id/admin-approve', protect, authorize('ADMIN'), adminApprove);

// Remarks & Escalations
router.post('/:id/remark', protect, authorize('CHAMBER_BACK_OFFICER', 'STAFF_COORDINATOR', 'HEAD_OFFICER', 'ADMIN'), addRemark);
router.put('/:id/escalation', protect, authorize('STAFF_COORDINATOR', 'HEAD_OFFICER', 'ADMIN', 'CHAMBER_BACK_OFFICER', 'BACK_OFFICER'), handleEscalation);

module.exports = router;
