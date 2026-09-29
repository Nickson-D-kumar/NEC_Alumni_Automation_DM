const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getAnalyticsSummary } = require('../controllers/analyticsController');

// @route   GET /api/analytics/summary
// @access  Private (ADMIN, HEAD_OFFICER, CHAMBER_BACK_OFFICER)
router.get('/summary', protect, authorize('ADMIN', 'HEAD_OFFICER', 'CHAMBER_BACK_OFFICER', 'BACK_OFFICER', 'BACKOFFICE'), getAnalyticsSummary);

module.exports = router;
