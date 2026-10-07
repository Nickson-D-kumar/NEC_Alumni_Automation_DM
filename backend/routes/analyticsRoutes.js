const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getAnalyticsSummary, getWeeklyBreakdown } = require('../controllers/analyticsController');

// @route   GET /api/analytics/summary
// @access  Private
router.get('/summary', protect, authorize('ADMIN', 'HEAD_OFFICER', 'CHAMBER_BACK_OFFICER', 'BACK_OFFICER', 'BACKOFFICE', 'STAFF_COORDINATOR', 'STUDENT_COORDINATOR'), getAnalyticsSummary);

// @route   GET /api/analytics/weekly-breakdown
// @access  Private
router.get('/weekly-breakdown', protect, authorize('ADMIN', 'HEAD_OFFICER', 'CHAMBER_BACK_OFFICER', 'BACK_OFFICER', 'BACKOFFICE', 'STAFF_COORDINATOR', 'STUDENT_COORDINATOR'), getWeeklyBreakdown);

module.exports = router;
