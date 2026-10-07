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
    // Explicit RBAC check: Head Officer has no email dispatch authority
    if (req.user && req.user.role === 'HEAD_OFFICER') {
      return res.status(403).json({
        success: false,
        message: 'Head Officer is not authorized to dispatch initiative emails to student coordinators'
      });
    }

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

// @desc    Get Computed Diff between Original Data & Student Submission
// @route   GET /api/back-officer/alumni/:id/diff, GET /api/officer/alumni/:id/diff
// @access  Private (Back Officer, Head Officer, Admin)
const getAlumniDiff = async (req, res) => {
  try {
    const alumni = await Alumni.findById(req.params.id)
      .populate('assignedTo', 'name email department')
      .populate('lastUpdatedByStudent', 'name email department')
      .populate('verifiedByBackOfficer', 'name email')
      .lean();

    if (!alumni) {
      return res.status(404).json({ success: false, message: 'Alumni record not found' });
    }

    const DIFF_FIELDS = [
      // 1. Personal Information
      { key: 'name', label: 'Full Name' },
      { key: 'gender', label: 'Gender' },
      { key: 'mobile', label: 'Mobile Phone No' },
      { key: 'email', label: 'Email ID' },
      { key: 'dob', label: 'Date of Birth', type: 'date' },
      { key: 'label', label: 'Category / Tag' },

      // 2. Location & Address Details
      { key: 'currentLocation', label: 'Current Location' },
      { key: 'homeTown', label: 'Home Town' },
      { key: 'areaInCityTownLocation', label: 'Area / Suburb' },
      { key: 'chapter', label: 'Alumni Chapter' },
      { key: 'address.correspondenceAddress', label: 'Correspondence Address' },
      { key: 'address.city', label: 'Address City' },
      { key: 'address.state', label: 'Address State' },
      { key: 'address.country', label: 'Address Country' },
      { key: 'address.pincode', label: 'Address Pincode' },

      // 3. Academic Background
      { key: 'batch', label: 'Batch' },
      { key: 'graduationYear', label: 'Graduation Year' },
      { key: 'department', label: 'Department' },
      { key: 'degree', label: 'Degree' },
      { key: 'educationalCourse', label: 'Course' },
      { key: 'educationalInstitute', label: 'Institute' },
      { key: 'startYear', label: 'Start Year' },
      { key: 'endYear', label: 'End Year' },

      // 4. Professional Details & Experience
      { key: 'professional.company', label: 'Company' },
      { key: 'professional.position', label: 'Position / Designation' },
      { key: 'professional.experienceYears', label: 'Work Experience (Years)', type: 'number' },
      { key: 'professional.skills', label: 'Skills', type: 'array' },
      { key: 'professional.rolesPlayed', label: 'Roles Played' },
      { key: 'professional.industriesWorkedIn', label: 'Industries' },

      // 5. Socials
      { key: 'socials.linkedin', label: 'LinkedIn Profile' },
      { key: 'socials.facebook', label: 'Facebook Profile' },

      // 6. Contributions & Preferences
      { key: 'contributions.mentorStudents', label: 'Mentorship', type: 'boolean' },
      { key: 'contributions.webinarSpeaker', label: 'Volunteer / Speaker', type: 'boolean' },
      { key: 'contributions.scholarships', label: 'Scholarships Contribution', type: 'boolean' }
    ];

    const getNestedValue = (obj, path) => {
      if (!obj) return undefined;
      const parts = path.split('.');
      let current = obj;
      for (const part of parts) {
        if (current === null || current === undefined) return undefined;
        current = current[part];
      }
      return current;
    };

    const formatValue = (val, type) => {
      if (val === null || val === undefined) return null;
      if (type === 'boolean') {
        return val ? 'Yes' : 'No';
      }
      if (type === 'date') {
        if (!val) return null;
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
      }
      if (type === 'array') {
        if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : null;
        return val ? String(val) : null;
      }
      const str = String(val).trim();
      return str.length > 0 ? str : null;
    };

    const isBlank = (v) => v === null || v === undefined || v === '' || v === '0000000000';

    const originalData = alumni.originalData || null;

    let modifiedCount = 0;
    let addedCount = 0;
    let unchangedCount = 0;

    const changes = DIFF_FIELDS.map(f => {
      const oldRaw = originalData ? getNestedValue(originalData, f.key) : null;
      const newRaw = getNestedValue(alumni, f.key);

      const oldFormatted = formatValue(oldRaw, f.type);
      const newFormatted = formatValue(newRaw, f.type);

      let status = 'UNCHANGED';
      if (originalData) {
        if (isBlank(oldFormatted) && !isBlank(newFormatted)) {
          status = 'NEWLY_ADDED';
          addedCount++;
        } else if (!isBlank(oldFormatted) && isBlank(newFormatted)) {
          status = 'REMOVED';
          modifiedCount++;
        } else if (!isBlank(oldFormatted) && !isBlank(newFormatted) && oldFormatted !== newFormatted) {
          status = 'MODIFIED';
          modifiedCount++;
        } else {
          status = 'UNCHANGED';
          unchangedCount++;
        }
      } else {
        // If legacy record without original snapshot, consider filled fields as current submission
        if (!isBlank(newFormatted)) {
          status = 'UNCHANGED';
          unchangedCount++;
        } else {
          status = 'UNCHANGED';
          unchangedCount++;
        }
      }

      return {
        field: f.key,
        label: f.label,
        oldValue: oldFormatted,
        newValue: newFormatted,
        status
      };
    });

    const studentCoordinator = alumni.lastUpdatedByStudent || alumni.assignedTo || null;

    return res.json({
      success: true,
      alumniId: alumni._id,
      alumniName: alumni.name,
      mobile: alumni.mobile,
      email: alumni.email,
      batch: alumni.batch,
      department: alumni.department,
      verificationStage: alumni.verificationStage,
      hasOriginalSnapshot: !!originalData,
      studentCoordinator: studentCoordinator ? {
        name: studentCoordinator.name,
        email: studentCoordinator.email,
        department: studentCoordinator.department || 'N/A'
      } : null,
      submittedAt: alumni.submittedAt || alumni.updatedAt,
      changes,
      summary: {
        totalFields: DIFF_FIELDS.length,
        modifiedCount,
        addedCount,
        unchangedCount
      }
    });
  } catch (error) {
    console.error('Error computing alumni diff:', error);
    return res.status(500).json({ success: false, message: 'Failed to compute record diff', error: error.message });
  }
};

// @desc    Request Student Revision by Back Officer
// @route   POST /api/back-officer/alumni/:id/request-revision, POST /api/officer/alumni/:id/request-revision
// @access  Private (Back Officer, Admin)
const requestStudentRevision = async (req, res) => {
  try {
    const { remarks } = req.body;
    const alumni = await Alumni.findById(req.params.id);

    if (!alumni) {
      return res.status(404).json({ success: false, message: 'Alumni record not found' });
    }

    if (!remarks || String(remarks).trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide specific revision remarks for the Student Coordinator' });
    }

    alumni.verificationStage = 'REVISION_REQUESTED';
    alumni.backOfficerRemarks = String(remarks).trim();

    alumni.adminRemarks.push({
      sender: req.user.id || req.user._id,
      role: 'CHAMBER_BACK_OFFICER',
      message: `Revision requested: ${String(remarks).trim()}`,
      createdAt: new Date()
    });

    await alumni.save();

    const updated = await Alumni.findById(req.params.id)
      .populate('assignedTo', 'name email department')
      .populate('lastUpdatedByStudent', 'name email department')
      .populate('adminRemarks.sender', 'name role');

    return res.json({
      success: true,
      message: 'Revision request successfully dispatched to the Student Coordinator!',
      data: updated
    });
  } catch (error) {
    console.error('Error requesting revision:', error);
    return res.status(500).json({ success: false, message: 'Failed to request revision', error: error.message });
  }
};

// @desc    Reject Verification by Back Officer
// @route   POST /api/back-officer/alumni/:id/reject, POST /api/officer/alumni/:id/reject
// @access  Private (Back Officer, Admin)
const rejectVerification = async (req, res) => {
  try {
    const reason = req.body.reason || req.body.remarks;
    const alumni = await Alumni.findById(req.params.id);

    if (!alumni) {
      return res.status(404).json({ success: false, message: 'Alumni record not found' });
    }

    if (!reason || String(reason).trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rejection reason is mandatory (e.g., Invalid phone number / fake details / unverified workplace)' 
      });
    }

    const rejectionText = String(reason).trim();
    alumni.verificationStage = 'VERIFICATION_REJECTED';
    alumni.rejectionReason = rejectionText;
    alumni.backOfficerRemarks = rejectionText;
    alumni.rejectedByBackOfficer = req.user.id || req.user._id;
    alumni.backOfficerRejectionDate = new Date();

    alumni.adminRemarks.push({
      sender: req.user.id || req.user._id,
      role: 'CHAMBER_BACK_OFFICER',
      message: `Verification Rejected: ${rejectionText}`,
      createdAt: new Date()
    });

    await alumni.save();

    const updated = await Alumni.findById(req.params.id)
      .populate('assignedTo', 'name email department')
      .populate('lastUpdatedByStudent', 'name email department')
      .populate('rejectedByBackOfficer', 'name email')
      .populate('adminRemarks.sender', 'name role');

    return res.json({
      success: true,
      message: 'Verification has been rejected. Record moved to Rejected status.',
      data: updated
    });
  } catch (error) {
    console.error('Error rejecting verification:', error);
    return res.status(500).json({ success: false, message: 'Failed to reject verification', error: error.message });
  }
};

module.exports = {
  verifyBackOfficer,
  verifyHead: verifyBackOfficer,
  sendReminder,
  getInactiveStudents,
  getAlumniDiff,
  requestStudentRevision,
  rejectVerification
};
