const Alumni = require('../models/Alumni');
const User = require('../models/User');
const CoordinatorReminderLog = require('../models/CoordinatorReminderLog');
const { sendInitiativeEmail, sendStaffInitiativeReminderEmail } = require('../utils/emailService');

// @desc    Allocate Quota of Alumni IDs to Student Coordinator
// @route   POST /api/staff/allocate
// @access  Private (Staff Coordinator, Admin)
const allocateQuota = async (req, res) => {
  try {
    const { alumniIds, studentId } = req.body;

    if (!alumniIds || !Array.isArray(alumniIds) || alumniIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one alumni record' });
    }

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Please select a student coordinator' });
    }

    // Verify student user exists and is STUDENT_COORDINATOR
    const student = await User.findById(studentId);
    if (!student || student.role !== 'STUDENT_COORDINATOR') {
      return res.status(400).json({ success: false, message: 'Invalid student coordinator selected' });
    }

    // Bulk update assignedTo and assignedBy
    const result = await Alumni.updateMany(
      { _id: { $in: alumniIds } },
      { 
        $set: { 
          assignedTo: studentId,
          assignedBy: req.user.id,
          assignedAt: new Date()
        } 
      }
    );

    return res.json({
      success: true,
      message: `Successfully allocated ${result.modifiedCount} alumni records to ${student.name}`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error allocating quota:', error);
    return res.status(500).json({ success: false, message: 'Failed to allocate alumni quota', error: error.message });
  }
};

// @desc    Get List of Student Coordinators with Workload Metrics
// @route   GET /api/staff/students
// @access  Private (Staff Coordinator, Head Officer, Admin, Chamber Back Officer)
const getStudentCoordinators = async (req, res) => {
  try {
    const students = await User.find({ role: 'STUDENT_COORDINATOR', isActive: true })
      .select('-password')
      .lean();

    // Attach workload counts for each student coordinator
    const studentsWithMetrics = await Promise.all(
      students.map(async (student) => {
        const totalAssigned = await Alumni.countDocuments({ assignedTo: student._id });
        const pendingSubmission = await Alumni.countDocuments({ 
          assignedTo: student._id, 
          verificationStage: 'PENDING_SUBMISSION' 
        });
        const submitted = await Alumni.countDocuments({ 
          assignedTo: student._id, 
          verificationStage: { $in: ['SUBMITTED_BY_STUDENT', 'VERIFIED_BY_HEAD', 'ADMIN_APPROVED'] } 
        });

        // Find last recorded call log date
        const lastAlumniRecord = await Alumni.findOne({ 'callLogs.recordedBy': student._id })
          .sort({ 'callLogs.timestamp': -1 })
          .select('callLogs');

        let lastActivity = null;
        if (lastAlumniRecord && lastAlumniRecord.callLogs && lastAlumniRecord.callLogs.length > 0) {
          const userLogs = lastAlumniRecord.callLogs
            .filter(l => String(l.recordedBy) === String(student._id))
            .sort((a, b) => b.timestamp - a.timestamp);
          if (userLogs.length > 0) lastActivity = userLogs[0].timestamp;
        }

        return {
          ...student,
          totalAssigned,
          pendingSubmission,
          submitted,
          lastActivity
        };
      })
    );

    return res.json({ success: true, data: studentsWithMetrics });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching student metrics', error: error.message });
  }
};

// @desc    Resolve or Escalate Alumni Record
// @route   PUT /api/alumni/:id/escalate
// @access  Private (Staff Coordinator, Head Officer, Admin)
const handleEscalation = async (req, res) => {
  try {
    const { escalationLevel, remark } = req.body;
    const validLevels = ['NONE', 'LEVEL_2_STAFF', 'LEVEL_3_HOD', 'LEVEL_4_CHAMBER_HEAD'];

    if (!validLevels.includes(escalationLevel)) {
      return res.status(400).json({ success: false, message: 'Invalid escalation level' });
    }

    const alumni = await Alumni.findById(req.params.id);
    if (!alumni) {
      return res.status(404).json({ success: false, message: 'Alumni record not found' });
    }

    if (alumni.verificationStage === 'ADMIN_APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot escalate an already Admin Approved record. Admin approval is final.'
      });
    }

    alumni.escalationLevel = escalationLevel;

    if (remark) {
      alumni.adminRemarks.push({
        sender: req.user.id,
        role: req.user.role,
        message: `[Escalation Status Updated to ${escalationLevel}] ${remark}`,
        createdAt: new Date()
      });
    }

    await alumni.save();

    return res.json({
      success: true,
      message: `Escalation updated to ${escalationLevel}`,
      data: alumni
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating escalation status', error: error.message });
  }
};

// @desc    Dispatch Assignment & Outreach Initiative Email to Student Coordinator
// @route   POST /api/staff/student-coordinators/:studentId/send-initiative-mail
//          POST /api/staff/send-initiative-mail
// @access  Private (Staff Coordinator, Admin)
const sendInitiativeMail = async (req, res) => {
  try {
    // Explicit RBAC check: Block HEAD_OFFICER per policy
    if (req.user && req.user.role === 'HEAD_OFFICER') {
      return res.status(403).json({
        success: false,
        message: 'Head Officer is not authorized to dispatch initiative emails to student coordinators'
      });
    }

    const studentId = req.params.studentId || req.body.studentId;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student Coordinator ID is required' });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'STUDENT_COORDINATOR') {
      return res.status(404).json({ success: false, message: 'Valid Student Coordinator not found' });
    }

    // Find all assigned records for this student
    const assignedRecords = await Alumni.find({ assignedTo: studentId }).select('batch');
    const assignedCount = assignedRecords.length;

    // Get unique target batches
    const uniqueBatches = [...new Set(assignedRecords.map(r => r.batch).filter(Boolean))].sort();

    // Supervising Staff details from authenticated user
    const staffCoordinatorName = req.user?.name || 'Staff Coordinator';
    const staffCoordinatorEmail = req.user?.email || 'staff@crm.com';
    const department = req.user?.department || student.department || 'Computer Science & Engineering';

    // Dispatch initiative email via email service
    await sendInitiativeEmail({
      to: student.email,
      studentName: student.name,
      assignedCount,
      assignedBatches: uniqueBatches,
      staffCoordinatorName,
      staffCoordinatorEmail,
      department
    });

    // Append audit remark to assigned records
    if (assignedRecords.length > 0) {
      await Alumni.updateMany(
        { assignedTo: studentId },
        {
          $push: {
            adminRemarks: {
              sender: req.user._id || req.user.id,
              role: req.user.role || 'STAFF_COORDINATOR',
              message: `Outreach initiative email dispatched to coordinator ${student.name} (${student.email}) by Prof. ${staffCoordinatorName} with ${assignedCount} assigned records.`,
              createdAt: new Date()
            }
          }
        }
      );
    }

    return res.json({
      success: true,
      message: `Initiative and assignment email successfully dispatched to ${student.name} (${student.email})`,
      data: {
        studentId: student._id,
        studentName: student.name,
        studentEmail: student.email,
        assignedCount,
        batches: uniqueBatches,
        dispatchedBy: staffCoordinatorName
      }
    });
  } catch (error) {
    console.error('Error sending initiative email:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to dispatch initiative email',
      error: error.message
    });
  }
};

// @desc    Get List of Student Coordinators with Inactivity & Reminder Tracking
// @route   GET /api/staff/coordinators/activity, GET /api/staff/inactive-students
// @access  Private (Staff Coordinator, Admin)
const getCoordinatorActivityMetrics = async (req, res) => {
  try {
    const students = await User.find({ role: 'STUDENT_COORDINATOR', isActive: true })
      .select('-password')
      .lean();

    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const activityList = await Promise.all(
      students.map(async (student) => {
        const totalAssigned = await Alumni.countDocuments({ assignedTo: student._id });
        const pendingCount = await Alumni.countDocuments({
          assignedTo: student._id,
          verificationStage: 'PENDING_SUBMISSION'
        });
        const submitted = await Alumni.countDocuments({
          assignedTo: student._id,
          verificationStage: { $in: ['SUBMITTED_BY_STUDENT', 'VERIFIED_BY_BACK_OFFICER', 'VERIFIED_BY_HEAD', 'ADMIN_APPROVED'] }
        });

        // Recent call logs in the last 3 days
        const recentLogs = await Alumni.countDocuments({
          'callLogs.recordedBy': student._id,
          'callLogs.timestamp': { $gte: threeDaysAgo }
        });

        // Recent submissions in the last 3 days
        const recentSubmissions = await Alumni.countDocuments({
          lastUpdatedByStudent: student._id,
          submittedAt: { $gte: threeDaysAgo }
        });

        // Check if reminder was sent today to prevent spam
        const todayReminder = await CoordinatorReminderLog.findOne({
          student_id: student._id,
          sent_at: { $gte: startOfToday }
        }).sort({ sent_at: -1 });

        const lastReminderLog = await CoordinatorReminderLog.findOne({
          student_id: student._id
        }).sort({ sent_at: -1 });

        // Inactive: has pending records and no recent logs or submissions in 3+ days
        const hasRecentActivity = (recentLogs > 0 || recentSubmissions > 0);
        const isInactive = pendingCount > 0 && !hasRecentActivity;

        return {
          ...student,
          totalAssigned,
          pendingCount,
          submitted,
          isInactive,
          recentLogsCount: recentLogs,
          recentSubmissionsCount: recentSubmissions,
          remindedToday: !!todayReminder,
          lastReminderSentAt: lastReminderLog ? lastReminderLog.sent_at : null
        };
      })
    );

    return res.json({ success: true, data: activityList });
  } catch (error) {
    console.error('Error fetching coordinator activity:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch coordinator activity', error: error.message });
  }
};

// @desc    Dispatch Outreach Initiative Reminder Email to Inactive Student Coordinator
// @route   POST /api/staff/coordinators/:studentId/remind-initiative
//          POST /api/staff/remind-initiative
// @access  Private (Staff Coordinator, Admin)
const sendInitiativeReminder = async (req, res) => {
  try {
    // Explicit RBAC check: Only STAFF_COORDINATOR and ADMIN
    if (req.user && req.user.role === 'HEAD_OFFICER') {
      return res.status(403).json({
        success: false,
        message: 'Head Officer is not authorized to dispatch initiative reminder emails'
      });
    }

    const studentId = req.params.studentId || req.body.studentId;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student Coordinator ID is required' });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'STUDENT_COORDINATOR') {
      return res.status(404).json({ success: false, message: 'Valid Student Coordinator not found' });
    }

    const pendingCount = await Alumni.countDocuments({
      assignedTo: studentId,
      verificationStage: 'PENDING_SUBMISSION'
    });

    const totalAssigned = await Alumni.countDocuments({
      assignedTo: studentId
    });

    const staffCoordinatorName = req.user?.name || 'Staff Coordinator';
    const staffCoordinatorEmail = req.user?.email || 'staff@crm.com';
    const department = req.user?.department || student.department || 'Computer Science & Engineering';

    // Dispatch institutional reminder email
    const emailInfo = await sendStaffInitiativeReminderEmail({
      to: student.email,
      studentName: student.name,
      pendingCount,
      totalAssigned,
      staffCoordinatorName,
      staffCoordinatorEmail,
      department
    });

    // Log the reminder event into coordinator_reminder_logs
    const reminderLog = await CoordinatorReminderLog.create({
      staff_id: req.user._id || req.user.id,
      student_id: student._id,
      sent_at: new Date(),
      pending_count: pendingCount,
      status: 'SENT',
      message_id: emailInfo?.messageId || null
    });

    // Append audit remark to assigned alumni records
    if (pendingCount > 0) {
      await Alumni.updateMany(
        { assignedTo: studentId, verificationStage: 'PENDING_SUBMISSION' },
        {
          $push: {
            adminRemarks: {
              sender: req.user._id || req.user.id,
              role: req.user.role || 'STAFF_COORDINATOR',
              message: `Initiative reminder email dispatched to ${student.name} (${student.email}) by Prof. ${staffCoordinatorName}. Pending: ${pendingCount}`,
              createdAt: new Date()
            }
          }
        }
      );
    }

    return res.json({
      success: true,
      message: `Initiative reminder dispatched to ${student.name} (${student.email}) successfully.`,
      data: {
        studentId: student._id,
        studentName: student.name,
        studentEmail: student.email,
        pendingCount,
        sentAt: reminderLog.sent_at,
        dispatchedBy: staffCoordinatorName
      }
    });
  } catch (error) {
    console.error('Error dispatching initiative reminder:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to dispatch initiative reminder email',
      error: error.message
    });
  }
};

module.exports = {
  allocateQuota,
  getStudentCoordinators,
  handleEscalation,
  sendInitiativeMail,
  getCoordinatorActivityMetrics,
  sendInitiativeReminder
};
