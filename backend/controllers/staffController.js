const Alumni = require('../models/Alumni');
const User = require('../models/User');

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
          assignedBy: req.user.id
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

module.exports = {
  allocateQuota,
  getStudentCoordinators,
  handleEscalation
};
