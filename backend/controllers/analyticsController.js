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

// @desc    Get Weekly Analysis Report Breakdown for Bar Chart
// @route   GET /api/analytics/weekly-breakdown
// @access  Private (ADMIN, HEAD_OFFICER, CHAMBER_BACK_OFFICER, BACK_OFFICER)
const getWeeklyBreakdown = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    const now = new Date();
    let endObj = endDate ? new Date(endDate) : new Date(now);
    endObj.setHours(23, 59, 59, 999);

    let startObj = startDate ? new Date(startDate) : new Date(endObj.getTime() - (56 * 24 * 60 * 60 * 1000));
    startObj.setHours(0, 0, 0, 0);

    // 1. Validation Constraints
    if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid start or end date format.' });
    }

    if (endObj.getTime() < startObj.getTime()) {
      return res.status(400).json({ success: false, message: 'To Date cannot be earlier than From Date.' });
    }

    const diffDays = Math.ceil((endObj.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 180) {
      return res.status(400).json({ success: false, message: 'Maximum date range is limited to 6 months.' });
    }

    // 2. Build Query Filter
    const filter = {
      verificationStage: { $in: ['ADMIN_APPROVED', 'VERIFIED_BY_BACK_OFFICER', 'VERIFIED_BY_HEAD'] },
      $or: [
        { backOfficerVerificationDate: { $gte: startObj, $lte: endObj } },
        { updatedAt: { $gte: startObj, $lte: endObj } },
        { createdAt: { $gte: startObj, $lte: endObj } }
      ]
    };

    if (department && department.trim() !== '' && department.toUpperCase() !== 'ALL') {
      filter.department = { $regex: new RegExp(`^${department.trim()}$`, 'i') };
    }

    // 3. Generate Chronological Week Buckets (0-fill logic)
    const weeks = [];
    let curWeekStart = new Date(startObj);
    let weekIndex = 1;

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    while (curWeekStart.getTime() <= endObj.getTime()) {
      let curWeekEnd = new Date(curWeekStart.getTime() + (6 * 24 * 60 * 60 * 1000));
      curWeekEnd.setHours(23, 59, 59, 999);

      if (curWeekEnd.getTime() > endObj.getTime()) {
        curWeekEnd = new Date(endObj);
      }

      const startDay = String(curWeekStart.getDate()).padStart(2, '0');
      const startMonth = monthNames[curWeekStart.getMonth()];
      const endDay = String(curWeekEnd.getDate()).padStart(2, '0');
      const endMonth = monthNames[curWeekEnd.getMonth()];

      const dateRangeText = `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
      const weekLabel = `Week ${weekIndex} (${dateRangeText})`;

      weeks.push({
        weekIndex,
        weekLabel,
        dateRangeText,
        startDate: curWeekStart.toISOString().split('T')[0],
        endDate: curWeekEnd.toISOString().split('T')[0],
        startTime: curWeekStart.getTime(),
        endTime: curWeekEnd.getTime(),
        verifiedCount: 0
      });

      // Advance by 7 days
      curWeekStart = new Date(curWeekStart.getTime() + (7 * 24 * 60 * 60 * 1000));
      curWeekStart.setHours(0, 0, 0, 0);
      weekIndex++;
    }

    // 4. Query Matching Verified Records
    const alumniRecords = await Alumni.find(filter).lean();

    for (const record of alumniRecords) {
      const recordTime = record.backOfficerVerificationDate
        ? new Date(record.backOfficerVerificationDate).getTime()
        : new Date(record.updatedAt).getTime();

      const matchingBucket = weeks.find(w => recordTime >= w.startTime && recordTime <= w.endTime);
      if (matchingBucket) {
        matchingBucket.verifiedCount += 1;
      }
    }

    // 5. Clean Response Payload
    const dataPayload = weeks.map(({ weekLabel, dateRangeText, startDate, endDate, verifiedCount }) => ({
      weekLabel,
      dateRangeText,
      startDate,
      endDate,
      verifiedCount
    }));

    return res.json({
      success: true,
      count: dataPayload.length,
      data: dataPayload
    });
  } catch (error) {
    console.error('Error fetching weekly breakdown analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve weekly breakdown analytics',
      error: error.message
    });
  }
};

module.exports = {
  getAnalyticsSummary,
  getWeeklyBreakdown
};
