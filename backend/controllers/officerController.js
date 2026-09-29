const Alumni = require('../models/Alumni');
const User = require('../models/User');
const { sendReminderEmail } = require('../utils/emailService');

// @desc    Verify Record by Back Officer
// @route   PUT /api/alumni/:id/verify-back-officer, PUT /api/alumni/:id/verify-head
// @access  Private (Back Officer, Admin)
const verifyBackOfficer = async (req, res) => {
  try {
    const alumni = await Alumni.findById(req.params.id);

    if (!alumni) {
      return res.status(404).json({ success: false, message: 'Alumni record not found' });
    }

    if (alumni.verificationStage === 'PENDING_SUBMISSION') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot verify record before Student Coordinator submission' 
      });
    }

    alumni.verificationStage = 'VERIFIED_BY_BACK_OFFICER';
    alumni.verifiedByBackOfficer = req.user.id || req.user._id;
    alumni.backOfficerVerificationDate = new Date();
    
    // Add verification log in adminRemarks audit trail
    alumni.adminRemarks.push({
      sender: req.user.id || req.user._id,
      role: 'CHAMBER_BACK_OFFICER',
      message: `Verified by Back Officer (${req.user.name})`,
      createdAt: new Date()
    });

    await alumni.save();

    const updated = await Alumni.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('adminRemarks.sender', 'name role');

    return res.json({
      success: true,
      message: 'Alumni record successfully verified by Back Officer!',
      data: updated
    });
  } catch (error) {
    console.error('Error in verifyBackOfficer:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify record', error: error.message });
  }
};

// @desc    Send Initiative Reminder Email to Inactive Student Coordinator
// @route   POST /api/officer/send-reminder
// @access  Private (Head Officer, Admin)
const sendReminder = async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student coordinator not found' });
    }

    const pendingCount = await Alumni.countDocuments({
      assignedTo: studentId,
      verificationStage: 'PENDING_SUBMISSION'
    });

    // Send email using email service
    await sendReminderEmail({
      to: student.email,
      studentName: student.name,
      pendingCount,
      officerName: req.user.name
    });

    return res.json({
      success: true,
      message: `Reminder email successfully dispatched to ${student.name} (${student.email})`
    });
  } catch (error) {
    console.error('Error sending reminder email:', error);
    return res.status(500).json({ success: false, message: 'Failed to dispatch reminder email', error: error.message });
  }
};

// @desc    Get List of Inactive Students
// @route   GET /api/officer/inactive-students
// @access  Private (Head Officer, Admin, Staff Coordinator)
const getInactiveStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'STUDENT_COORDINATOR', isActive: true })
      .select('-password')
      .lean();

    const inactiveStudents = [];

    for (const student of students) {
      const pendingCount = await Alumni.countDocuments({
        assignedTo: student._id,
        verificationStage: 'PENDING_SUBMISSION'
      });

      if (pendingCount > 0) {
        // Check if there are any call logs in the last 3 days
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const recentLogs = await Alumni.countDocuments({
          'callLogs.recordedBy': student._id,
          'callLogs.timestamp': { $gte: threeDaysAgo }
        });

        inactiveStudents.push({
          ...student,
          pendingCount,
          isInactive: recentLogs === 0,
          recentLogsCount: recentLogs
        });
      }
    }

    return res.json({ success: true, data: inactiveStudents });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching inactive students', error: error.message });
  }
};

module.exports = {
  verifyBackOfficer,
  verifyHead: verifyBackOfficer,
  sendReminder,
  getInactiveStudents
};
