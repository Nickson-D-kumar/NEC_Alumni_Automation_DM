const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { 
  uploadMasterSheet,
  uploadExcel,
  getPendingApprovals,
  adminApprove,
  bulkApprove, 
  getUsers, 
  createUser,
  createStudentCoordinator,
  getPendingStudents,
  verifyStudentRegistration,
  getPayoutRequests,
  processPayoutRequest,
  toggleUserStatus,
  deleteUser
} = require('../controllers/adminController');

router.post('/upload-master-sheet', protect, authorize('ADMIN'), upload.single('file'), uploadMasterSheet);
router.post('/upload-excel', protect, authorize('ADMIN'), upload.single('file'), uploadMasterSheet);
router.post('/alumni/upload', protect, authorize('ADMIN'), upload.single('file'), uploadMasterSheet);

// Admin Alumni Approval Endpoints
router.get('/pending-approvals', protect, authorize('ADMIN'), getPendingApprovals);
router.post('/approve/:id', protect, authorize('ADMIN'), adminApprove);
router.put('/bulk-approve', protect, authorize('ADMIN'), bulkApprove);

// Student Cheque Validation Payout Requests
router.get('/payout-requests', protect, authorize('ADMIN'), getPayoutRequests);
router.put('/payout-requests/:id/process', protect, authorize('ADMIN'), processPayoutRequest);

router.get('/users', protect, authorize('ADMIN'), getUsers);
router.post('/users', protect, authorize('ADMIN'), createUser);
router.patch('/users/:userId/status', protect, authorize('ADMIN'), toggleUserStatus);
router.put('/users/:userId/status', protect, authorize('ADMIN'), toggleUserStatus);
router.delete('/users/:userId', protect, authorize('ADMIN'), deleteUser);
router.post('/create-student', protect, authorize('ADMIN'), createStudentCoordinator);

// Student registration verification endpoints EXCLUSIVELY for ADMIN
router.get('/pending-students', protect, authorize('ADMIN'), getPendingStudents);
router.put('/verify-student/:id', protect, authorize('ADMIN'), verifyStudentRegistration);

module.exports = router;
