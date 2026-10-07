const Alumni = require('../models/Alumni');
const User = require('../models/User');

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
// @desc    Get Weekly Analysis Report Breakdown for Bar Chart (Target vs Achieved)
// @route   GET /api/analytics/weekly-breakdown
// @access  Private (ADMIN, HEAD_OFFICER, CHAMBER_BACK_OFFICER, BACK_OFFICER, STAFF_COORDINATOR, STUDENT_COORDINATOR)
const getWeeklyBreakdown = async (req, res) => {
  try {
    const { startDate, endDate, department, studentId: queryStudentId } = req.query;

    // If logged-in user is a STUDENT_COORDINATOR, bind to their own ID
    let studentId = queryStudentId;
    if (req.user && req.user.role === 'STUDENT_COORDINATOR') {
      studentId = req.user._id || req.user.id;
    }

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

    // 2. Generate Chronological Week Buckets (0-fill logic)
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
      const weekLabel = `Week ${weekIndex}`;

      weeks.push({
        weekIndex,
        weekLabel,
        dateRangeText,
        startDate: curWeekStart.toISOString().split('T')[0],
        endDate: curWeekEnd.toISOString().split('T')[0],
        startTime: curWeekStart.getTime(),
        endTime: curWeekEnd.getTime(),
        target: 0,
        achieved: 0
      });

      curWeekStart = new Date(curWeekStart.getTime() + (7 * 24 * 60 * 60 * 1000));
      curWeekStart.setHours(0, 0, 0, 0);
      weekIndex++;
    }

    // 3. Query Target Records (Allocated to student / coordinators)
    const targetQuery = {
      assignedTo: { $ne: null }
    };

    if (studentId && studentId !== 'ALL') {
      targetQuery.assignedTo = studentId;
    }

    if (department && department.trim() !== '' && department.toUpperCase() !== 'ALL') {
      targetQuery.department = { $regex: new RegExp(`^${department.trim()}$`, 'i') };
    }

    const assignedRecords = await Alumni.find(targetQuery)
      .select('assignedTo assignedAt createdAt updatedAt department')
      .lean();

    for (const record of assignedRecords) {
      const assignTime = record.assignedAt
        ? new Date(record.assignedAt).getTime()
        : (record.createdAt ? new Date(record.createdAt).getTime() : new Date(record.updatedAt).getTime());

      const matchingBucket = weeks.find(w => assignTime >= w.startTime && assignTime <= w.endTime);
      if (matchingBucket) {
        matchingBucket.target += 1;
      }
    }

    // 4. Query Achieved Records (Records that reached final verification / approval)
    const achievedQuery = {
      $or: [
        { verificationStage: 'ADMIN_APPROVED' },
        { verificationStage: 'VERIFIED_BY_BACK_OFFICER' }
      ]
    };

    if (studentId && studentId !== 'ALL') {
      achievedQuery.assignedTo = studentId;
    }

    if (department && department.trim() !== '' && department.toUpperCase() !== 'ALL') {
      achievedQuery.department = { $regex: new RegExp(`^${department.trim()}$`, 'i') };
    }

    const verifiedRecords = await Alumni.find(achievedQuery)
      .select('assignedTo lastUpdatedByStudent backOfficerVerificationDate submittedAt updatedAt verificationStage department adminRemarks')
      .lean();

    for (const record of verifiedRecords) {
      let verifyTime;
      if (record.verificationStage === 'ADMIN_APPROVED') {
        const lastAdminRemark = record.adminRemarks && record.adminRemarks.length > 0
          ? record.adminRemarks[record.adminRemarks.length - 1].createdAt
          : null;
        verifyTime = lastAdminRemark
          ? new Date(lastAdminRemark).getTime()
          : (record.updatedAt ? new Date(record.updatedAt).getTime() : new Date(record.backOfficerVerificationDate || record.createdAt).getTime());
      } else {
        verifyTime = record.backOfficerVerificationDate
          ? new Date(record.backOfficerVerificationDate).getTime()
          : (record.submittedAt ? new Date(record.submittedAt).getTime() : new Date(record.updatedAt).getTime());
      }

      const matchingBucket = weeks.find(w => verifyTime >= w.startTime && verifyTime <= w.endTime);
      if (matchingBucket) {
        matchingBucket.achieved += 1;
      }
    }

    // 5. Compute Summary Metrics & Retrieve Departments
    const totalTarget = weeks.reduce((acc, w) => acc + (w.target || 0), 0);
    const totalAchieved = weeks.reduce((acc, w) => acc + (w.achieved || 0), 0);
    const conversionRate = totalTarget > 0 ? Number(((totalAchieved / totalTarget) * 100).toFixed(1)) : 0;

    const dbDepartments = await Alumni.distinct('department');
    const defaultDepartments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'];
    const departmentList = Array.from(new Set([...defaultDepartments, ...(dbDepartments || [])]))
      .filter(d => d && d.trim() !== '');

    const coordinators = await User.find({ role: 'STUDENT_COORDINATOR', isActive: true })
      .select('_id name email department')
      .lean();

    // 6. Clean Response Payload
    const dataPayload = weeks.map(({ weekLabel, dateRangeText, startDate, endDate, target, achieved }) => ({
      weekLabel,
      dateRangeText,
      startDate,
      endDate,
      target,
      achieved
    }));

    return res.json({
      success: true,
      count: dataPayload.length,
      data: dataPayload,
      summary: {
        totalTarget,
        totalAchieved,
        conversionRate: `${conversionRate}%`
      },
      departments: departmentList,
      departmentList,
      coordinators
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
