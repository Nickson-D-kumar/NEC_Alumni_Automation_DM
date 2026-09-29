const Alumni = require('../models/Alumni');

// @desc    Get Analytics & Data Insights Summary
// @route   GET /api/analytics/summary
// @access  Private (ADMIN, HEAD_OFFICER)
const getAnalyticsSummary = async (req, res) => {
  try {
    const { department, range } = req.query;

    let query = {};

    // 1. Department Filter
    if (department && department.trim() !== '' && department.toUpperCase() !== 'ALL') {
      query.department = { $regex: new RegExp(`^${department.trim()}$`, 'i') };
    }

    // 2. Timeframe Filter (createdAt / updatedAt)
    if (range && range !== 'all') {
      const now = new Date();
      let startDate = new Date();

      if (range === '1m') {
        startDate.setMonth(now.getMonth() - 1);
      } else if (range === '6m') {
        startDate.setMonth(now.getMonth() - 6);
      } else if (range === '1y') {
        startDate.setFullYear(now.getFullYear() - 1);
      }

      query.updatedAt = { $gte: startDate };
    }

    // 3. Dynamic Departments list from database
    const dbDepartments = await Alumni.distinct('department');
    const defaultDepartments = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIDS', 'OTHER'];
    const departmentList = Array.from(new Set([...defaultDepartments, ...(dbDepartments || [])])).filter(Boolean);

    // 4. Aggregations
    const [
      total,
      adminApproved,
      verifiedByBackOfficer,
      submittedByStudent,
      pendingSubmission,
      reachedComplete,
      reachedIncomplete
    ] = await Promise.all([
      Alumni.countDocuments(query),
      Alumni.countDocuments({ ...query, verificationStage: 'ADMIN_APPROVED' }),
      Alumni.countDocuments({ ...query, verificationStage: 'VERIFIED_BY_BACK_OFFICER' }),
      Alumni.countDocuments({ ...query, verificationStage: 'SUBMITTED_BY_STUDENT' }),
      Alumni.countDocuments({ ...query, verificationStage: 'PENDING_SUBMISSION' }),
      Alumni.countDocuments({ ...query, contactStatus: 'REACHED_COMPLETE' }),
      Alumni.countDocuments({ ...query, contactStatus: 'REACHED_INCOMPLETE' })
    ]);

    // Completed records = Fully approved or verified by Back Officer
    const completed = adminApproved + verifiedByBackOfficer;
    // Pending records = Pending submission or waiting for verification
    const pending = Math.max(0, total - completed);

    const completionRate = total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0;
    const pendingRate = total > 0 ? Number(((pending / total) * 100).toFixed(1)) : 0;
    const reachedRate = total > 0 ? Number((((reachedComplete + reachedIncomplete) / total) * 100).toFixed(1)) : 0;

    return res.json({
      success: true,
      data: {
        total: total || 0,
        completed: completed || 0,
        pending: pending || 0,
        completionRate,
        pendingRate,
        reachedRate,
        breakdown: {
          adminApproved: adminApproved || 0,
          verifiedByBackOfficer: verifiedByBackOfficer || 0,
          submittedByStudent: submittedByStudent || 0,
          pendingSubmission: pendingSubmission || 0,
          reachedComplete: reachedComplete || 0,
          reachedIncomplete: reachedIncomplete || 0
        },
        departmentList
      }
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics summary',
      error: error.message
    });
  }
};

module.exports = {
  getAnalyticsSummary
};
