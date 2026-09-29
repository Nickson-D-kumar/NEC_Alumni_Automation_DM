const Alumni = require('../models/Alumni');
const User = require('../models/User');
const AlumniMonthlyTracking = require('../models/AlumniMonthlyTracking');
const StudentWallet = require('../models/StudentWallet');
const PayoutRequest = require('../models/PayoutRequest');

// @desc    Get alumni list with RBAC boundary & filters (Optimized for High Volume & Defensive Null Handling)
// @route   GET /api/alumni
// @access  Private
const getAlumni = async (req, res) => {
  try {
    const { 
      batch, 
      search, 
      verificationStage, 
      contactStatus, 
      escalationLevel, 
      assignedTo,
      page = 1,
      limit = 50
    } = req.query;

    let query = {};

    // RBAC Scope Boundaries
    if (req.user && req.user.role === 'STUDENT_COORDINATOR') {
      query.assignedTo = req.user.id || req.user._id;
    } else if (assignedTo) {
      if (assignedTo === 'unassigned') {
        query.assignedTo = null;
      } else {
        query.assignedTo = assignedTo;
      }
    }

    if (batch) query.batch = String(batch).trim();

    if (verificationStage) {
      if (verificationStage === 'VERIFIED_BY_BACK_OFFICER' || verificationStage === 'VERIFIED_BY_HEAD') {
        query.$or = [
          { verificationStage: 'VERIFIED_BY_BACK_OFFICER' },
          { verificationStage: 'VERIFIED_BY_HEAD' }
        ];
      } else {
        query.verificationStage = { $regex: new RegExp(`^${verificationStage.trim()}$`, 'i') };
      }
    }

    if (contactStatus) {
      if (contactStatus === 'REACHED' || contactStatus === 'REACHED_COMPLETE') {
        query.contactStatus = { $regex: /^REACHED/i };
      } else if (contactStatus === 'NOT_REACHED') {
        query.$or = [
          { contactStatus: { $regex: /^(NOT_REACHED|NOT_ATTEMPTED|NOT_CONTACTED)$/i } },
          { contactStatus: null },
          { contactStatus: { $exists: false } }
        ];
      } else {
        query.contactStatus = { $regex: new RegExp(`^${contactStatus.trim()}$`, 'i') };
      }
    }

    if (escalationLevel) query.escalationLevel = String(escalationLevel).trim();

    if (search && String(search).trim() !== '') {
      const cleanSearch = String(search).trim();
      query.$or = [
        { name: { $regex: cleanSearch, $options: 'i' } },
        { email: { $regex: cleanSearch, $options: 'i' } },
        { mobile: { $regex: cleanSearch, $options: 'i' } },
        { regNo: { $regex: cleanSearch, $options: 'i' } },
        { 'professional.company': { $regex: cleanSearch, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(500, Math.max(1, Number(limit) || 50));

    const [total, alumni] = await Promise.all([
      Alumni.countDocuments(query),
      Alumni.find(query)
        .populate('assignedTo', 'name email department')
        .sort({ updatedAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean()
    ]);

    return res.json({
      success: true,
      count: alumni.length,
      total: total || 0,
      page: pageNum,
      pages: Math.ceil((total || 0) / limitNum) || 1,
      data: alumni || []
    });
  } catch (error) {
    console.error('Error fetching alumni:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve alumni records', 
      error: error.message,
      data: [],
      total: 0
    });
  }
};

// @desc    Get single alumni details
// @route   GET /api/alumni/:id
// @access  Private
const getAlumniById = async (req, res) => {
  try {
    const record = await Alumni.findById(req.params.id)
      .populate('assignedTo', 'name email department')
      .populate('assignedBy', 'name email')
      .populate('callLogs.recordedBy', 'name role')
      .populate('adminRemarks.sender', 'name role');

    if (!record) {
      return res.status(404).json({ success: false, message: 'Alumni record not found' });
    }

    // RBAC check for Student Coordinator
    if (req.user.role === 'STUDENT_COORDINATOR' && String(record.assignedTo?._id || record.assignedTo) !== String(req.user.id || req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied to this assigned record' });
    }

    return res.json({ success: true, data: record });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error retrieving record', error: error.message });
  }
};

// @desc    Log Outreach Call/WhatsApp/Email Attempt
// @route   POST /api/alumni/:id/log-call
// @access  Private (Student Coordinator, Admin)
const logCall = async (req, res) => {
  try {
    const { channel, outcome, remarks } = req.body;
    const alumni = await Alumni.findById(req.params.id);

    if (!alumni) {
      return res.status(404).json({ success: false, message: 'Alumni record not found' });
    }

    alumni.callLogs.push({
      timestamp: new Date(),
      channel: channel || 'CALL',
      outcome: outcome || 'ATTENDED',
      remarks: remarks || '',
      recordedBy: req.user.id || req.user._id
    });

    if (outcome === 'ATTENDED') {
      alumni.contactStatus = 'REACHED_COMPLETE';
    } else {
      alumni.contactStatus = 'NOT_REACHED';
    }

    await alumni.save();
    return res.json({ success: true, message: 'Outreach log saved successfully!', data: alumni });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error logging call', error: error.message });
  }
};

// @desc    Update Alumni Record Data by Student Coordinator
// @route   PUT /api/alumni/:id/update-data, PATCH /api/alumni/:id, PUT /api/alumni/:id/verify
// @access  Private (Student Coordinator, Admin)
const updateData = async (req, res) => {
  try {
    const alumni = await Alumni.findById(req.params.id);

    if (!alumni) {
      return res.status(404).json({ success: false, message: 'Alumni record not found' });
    }

    const { 
      name, 
      gender,
      mobile, 
      dob,
      email, 
      label,
      regNo,
      batch,
      graduationYear,
      department,
      degree,
      currentLocation, 
      homeTown,
      areaInCityTownLocation,
      chapter,
      address,
      educationalCourse,
      educationalInstitute,
      startYear,
      endYear,
      company, 
      position, 
      workExperienceYears,
      experienceYears, 
      skills,
      rolesPlayed,
      industriesWorkedIn,
      higherStudies,
      linkedin,
      facebook,
      wouldYouLikeToMentor,
      wouldYouLikeToBeAVolunteer,
      contributeToScholarships,
      mentorStudents,
      webinarSpeaker,
      scholarships,
      contactStatus,
      callOutcome,
      verificationRemarks,
      submitForVerification
    } = req.body;

    // 1. Personal Information
    if (name !== undefined) alumni.name = name;
    if (gender !== undefined) alumni.gender = gender;
    if (mobile !== undefined) alumni.mobile = mobile;
    if (dob !== undefined) alumni.dob = dob ? new Date(dob) : null;
    if (email !== undefined) alumni.email = email;
    if (label !== undefined) alumni.label = label;
    alumni.profileUpdatedOn = new Date();

    // 2. Location & Address Details
    if (currentLocation !== undefined) alumni.currentLocation = currentLocation;
    if (homeTown !== undefined) alumni.homeTown = homeTown;
    if (areaInCityTownLocation !== undefined) alumni.areaInCityTownLocation = areaInCityTownLocation;
    if (chapter !== undefined) alumni.chapter = chapter;

    if (address && typeof address === 'object') {
      if (!alumni.address) alumni.address = {};
      if (address.correspondenceAddress !== undefined) alumni.address.correspondenceAddress = address.correspondenceAddress;
      if (address.city !== undefined) alumni.address.city = address.city;
      if (address.state !== undefined) alumni.address.state = address.state;
      if (address.country !== undefined) alumni.address.country = address.country;
      if (address.pincode !== undefined) alumni.address.pincode = address.pincode;
    }

    // 3. Academic Background
    if (batch !== undefined) alumni.batch = batch;
    if (graduationYear !== undefined) alumni.graduationYear = graduationYear;
    if (department !== undefined) alumni.department = department;
    if (degree !== undefined) alumni.degree = degree;
    if (educationalCourse !== undefined) alumni.educationalCourse = educationalCourse;
    if (educationalInstitute !== undefined) alumni.educationalInstitute = educationalInstitute;
    if (startYear !== undefined) alumni.startYear = startYear;
    if (endYear !== undefined) alumni.endYear = endYear;

    // 4. Professional Details & Experience
    if (!alumni.professional) alumni.professional = {};
    if (company !== undefined) alumni.professional.company = company;
    if (position !== undefined) alumni.professional.position = position;
    
    const exp = workExperienceYears !== undefined ? workExperienceYears : experienceYears;
    if (exp !== undefined) alumni.professional.experienceYears = Number(exp) || 0;
    
    if (skills !== undefined) alumni.professional.skills = Array.isArray(skills) ? skills : (typeof skills === 'string' ? skills.split(',').map(s => s.trim()).filter(Boolean) : []);
    if (rolesPlayed !== undefined) alumni.professional.rolesPlayed = rolesPlayed;
    if (industriesWorkedIn !== undefined) alumni.professional.industriesWorkedIn = industriesWorkedIn;

    if (!alumni.socials) alumni.socials = {};
    if (linkedin !== undefined) alumni.socials.linkedin = linkedin;
    if (facebook !== undefined) alumni.socials.facebook = facebook;

    // 5. Engagement & Contribution Preferences
    if (!alumni.contributions) alumni.contributions = {};
    const mentor = wouldYouLikeToMentor !== undefined ? wouldYouLikeToMentor : mentorStudents;
    if (mentor !== undefined) alumni.contributions.mentorStudents = Boolean(mentor);

    const volunteer = wouldYouLikeToBeAVolunteer !== undefined ? wouldYouLikeToBeAVolunteer : webinarSpeaker;
    if (volunteer !== undefined) alumni.contributions.webinarSpeaker = Boolean(volunteer);

    const schol = contributeToScholarships !== undefined ? contributeToScholarships : scholarships;
    if (schol !== undefined) alumni.contributions.scholarships = Boolean(schol);

    // Workflow Audit Metadata
    if (contactStatus) alumni.contactStatus = contactStatus;
    alumni.lastUpdatedByStudent = req.user.id || req.user._id;
    alumni.lastContactedAt = new Date();

    if (callOutcome || verificationRemarks) {
      alumni.callLogs.push({
        timestamp: new Date(),
        channel: 'CALL',
        outcome: callOutcome || (contactStatus === 'REACHED_COMPLETE' ? 'ATTENDED' : 'NOT_CONNECTED'),
        remarks: verificationRemarks || 'Updated pre-filled master sheet verification details',
        recordedBy: req.user.id || req.user._id
      });
    }

    if (submitForVerification || contactStatus === 'REACHED_COMPLETE') {
      alumni.verificationStage = 'SUBMITTED_BY_STUDENT';
    }

    await alumni.save();

    const updatedRecord = await Alumni.findById(alumni._id)
      .populate('assignedTo', 'name email department')
      .populate('lastUpdatedByStudent', 'name email');

    return res.json({
      success: true,
      message: submitForVerification || alumni.verificationStage === 'SUBMITTED_BY_STUDENT'
        ? 'Alumni record updated & submitted for Back Officer Verification!' 
        : 'Alumni record progress saved successfully!',
      data: updatedRecord
    });
  } catch (error) {
    console.error('Error updating alumni record:', error);
    return res.status(500).json({ success: false, message: 'Error updating profile', error: error.message });
  }
};

// @desc    Add Feedback Remark Thread Entry
// @route   POST /api/alumni/:id/remark, POST /api/alumni/:id/add-remark
// @access  Private (Officer, Admin)
const addRemark = async (req, res) => {
  try {
    const { remark, message } = req.body;
    const alumni = await Alumni.findById(req.params.id);

    if (!alumni) {
      return res.status(404).json({ success: false, message: 'Alumni record not found' });
    }

    alumni.adminRemarks.push({
      sender: req.user.id || req.user._id,
      role: req.user.role,
      message: remark || message || 'New remark added',
      createdAt: new Date()
    });

    await alumni.save();

    const updated = await Alumni.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('adminRemarks.sender', 'name role');

    return res.json({
      success: true,
      message: 'Remark posted to audit thread!',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error adding remark', error: error.message });
  }
};

// @desc    Get dashboard statistics (Defensive Parallelized Aggregation)
// @route   GET /api/alumni/stats
// @access  Private
const getStats = async (req, res) => {
  try {
    const [
      totalRaw,
      pendingSubmissionRaw,
      submittedByStudentRaw,
      verifiedByBackOfficerRaw,
      adminApprovedRaw,
      reachedCompleteRaw,
      reachedIncompleteRaw,
      notReachedRaw,
      notAttemptedRaw,
      level2EscalationsRaw,
      level3EscalationsRaw,
      level4EscalationsRaw
    ] = await Promise.all([
      Alumni.countDocuments(),
      Alumni.countDocuments({ verificationStage: { $regex: /^PENDING_SUBMISSION$/i } }),
      Alumni.countDocuments({ verificationStage: { $regex: /^SUBMITTED_BY_STUDENT$/i } }),
      Alumni.countDocuments({
        $or: [
          { verificationStage: { $regex: /^VERIFIED_BY_BACK_OFFICER$/i } },
          { verificationStage: { $regex: /^VERIFIED_BY_HEAD$/i } }
        ]
      }),
      Alumni.countDocuments({ verificationStage: { $regex: /^ADMIN_APPROVED$/i } }),
      Alumni.countDocuments({ contactStatus: { $regex: /^REACHED_COMPLETE$/i } }),
      Alumni.countDocuments({ contactStatus: { $regex: /^REACHED_INCOMPLETE$/i } }),
      Alumni.countDocuments({ contactStatus: { $regex: /^(NOT_REACHED|NOT_CONTACTED)$/i } }),
      Alumni.countDocuments({ 
        $or: [
          { contactStatus: { $exists: false } },
          { contactStatus: null },
          { contactStatus: '' },
          { contactStatus: { $regex: /^(NOT_ATTEMPTED|PENDING)$/i } }
        ] 
      }),
      Alumni.countDocuments({ escalationLevel: 'LEVEL_2_STAFF' }),
      Alumni.countDocuments({ escalationLevel: 'LEVEL_3_HOD' }),
      Alumni.countDocuments({ escalationLevel: 'LEVEL_4_CHAMBER_HEAD' })
    ]);

    const total = totalRaw || 0;
    const reachedCount = (reachedCompleteRaw || 0) + (reachedIncompleteRaw || 0);
    const notReachedCount = (notReachedRaw || 0) + (notAttemptedRaw || 0);
    const remainingCount = Math.max(0, total - reachedCount);

    const reachedPercentage = total > 0 ? ((reachedCount / total) * 100).toFixed(1) : '0.0';
    const backOfficerVerifiedPercentage = total > 0 ? (((verifiedByBackOfficerRaw || 0) / total) * 100).toFixed(1) : '0.0';
    const fullyApprovedPercentage = total > 0 ? (((adminApprovedRaw || 0) / total) * 100).toFixed(1) : '0.0';

    return res.json({
      success: true,
      stats: {
        total,
        reachedCount,
        reachedComplete: reachedCompleteRaw || 0,
        notReachedCount,
        remainingCount,
        notReached: notReachedRaw || 0,
        notContacted: notAttemptedRaw || 0,
        pendingSubmission: pendingSubmissionRaw || 0,
        submittedByStudent: submittedByStudentRaw || 0,
        verifiedByBackOfficer: verifiedByBackOfficerRaw || 0,
        verifiedByHead: verifiedByBackOfficerRaw || 0,
        adminApproved: adminApprovedRaw || 0,
        reachedPercentage: Number(reachedPercentage),
        backOfficerVerifiedPercentage: Number(backOfficerVerifiedPercentage),
        headVerifiedPercentage: Number(backOfficerVerifiedPercentage),
        fullyApprovedPercentage: Number(fullyApprovedPercentage),
        escalations: {
          level2: level2EscalationsRaw || 0,
          level3: level3EscalationsRaw || 0,
          level4: level4EscalationsRaw || 0,
          total: (level2EscalationsRaw || 0) + (level3EscalationsRaw || 0) + (level4EscalationsRaw || 0)
        }
      }
    });
  } catch (error) {
    console.error('Error in getStats:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error retrieving statistics', 
      error: error.message,
      stats: {
        total: 0,
        reachedCount: 0,
        remainingCount: 0,
        notReached: 0,
        notContacted: 0,
        pendingSubmission: 0,
        submittedByStudent: 0,
        verifiedByBackOfficer: 0,
        verifiedByHead: 0,
        adminApproved: 0,
        reachedPercentage: 0,
        backOfficerVerifiedPercentage: 0,
        headVerifiedPercentage: 0,
        fullyApprovedPercentage: 0,
        escalations: { level2: 0, level3: 0, level4: 0, total: 0 }
      }
    });
  }
};

// @desc    Privileged User: Full Profile Inspection Data
// @route   GET /api/alumni/:id/inspect
// @access  Private (Chamber Back Officer, Head Officer, Admin)
const inspectAlumni = async (req, res) => {
  try {
    const record = await Alumni.findById(req.params.id)
      .populate('assignedTo', 'name email department')
      .populate('adminRemarks.sender', 'name role')
      .populate('callLogs.recordedBy', 'name role');

    if (!record) {
      return res.status(404).json({ success: false, message: 'Alumni record not found' });
    }

    return res.json({ success: true, data: record });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error retrieving profile inspection data', error: error.message });
  }
};

// @desc    Privileged User: Post Direct Remark to Inspection Drawer
// @route   POST /api/alumni/:id/add-remark
// @access  Private (Chamber Back Officer, Head Officer, Admin)
const addRemarkPost = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || String(message).trim() === '') {
      return res.status(400).json({ success: false, message: 'Remark text cannot be empty' });
    }

    const alumni = await Alumni.findById(req.params.id);
    if (!alumni) {
      return res.status(404).json({ success: false, message: 'Alumni record not found' });
    }

    alumni.adminRemarks.push({
      sender: req.user.id || req.user._id,
      role: req.user.role,
      message: String(message).trim(),
      createdAt: new Date()
    });

    await alumni.save();

    const updated = await Alumni.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('adminRemarks.sender', 'name role');

    return res.json({ success: true, message: 'Remark submitted successfully!', data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to submit remark', error: error.message });
  }
};

// @desc    Get Remarks Thread for Assigned Student Coordinator
// @route   GET /api/alumni/:id/student-remarks
// @access  Private (Student Coordinator)
const getStudentRemarks = async (req, res) => {
  try {
    const record = await Alumni.findById(req.params.id)
      .select('name adminRemarks assignedTo')
      .populate('adminRemarks.sender', 'name role');

    if (!record) {
      return res.status(404).json({ success: false, message: 'Alumni record not found' });
    }

    if (String(record.assignedTo) !== String(req.user.id || req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.json({ success: true, remarks: record.adminRemarks || [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching remarks', error: error.message });
  }
};

// @desc    Get monthly outreach matrix tracking data for assigned alumni
// @route   GET /api/student/monthly-tracking, GET /api/alumni/monthly-tracking
// @access  Private (Student Coordinator, Admin, Head Officer, Back Officer)
const getMonthlyTracking = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const month = Number(req.query.month) || (new Date().getMonth() + 1);

    let alumniQuery = {};
    if (req.user.role === 'STUDENT_COORDINATOR') {
      alumniQuery.assignedTo = req.user.id || req.user._id;
    }

    const alumniList = await Alumni.find(alumniQuery)
      .select('name mobile batch department verificationStage contactStatus assignedTo')
      .lean();

    const alumniIds = alumniList.map(a => a._id);

    const trackingRecords = await AlumniMonthlyTracking.find({
      alumni: { $in: alumniIds },
      year,
      month
    }).lean();

    return res.json({
      success: true,
      year,
      month,
      alumni: alumniList,
      tracking: trackingRecords
    });
  } catch (error) {
    console.error('Error fetching monthly tracking:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch monthly tracking data', error: error.message });
  }
};

// @desc    Update milestone state for a specific alumni, year, month, and weekNumber
// @route   PATCH /api/student/monthly-tracking, PATCH /api/alumni/monthly-tracking
// @access  Private (Student Coordinator, Admin)
const updateMonthlyTracking = async (req, res) => {
  try {
    const { alumni_id, alumniId, year, month, week_number, weekNumber, milestone, status } = req.body;
    
    const targetAlumniId = alumniId || alumni_id;
    const targetYear = Number(year);
    const targetMonth = Number(month);
    const targetWeek = Number(weekNumber !== undefined ? weekNumber : week_number);

    if (!targetAlumniId || !targetYear || !targetMonth || !targetWeek || !milestone) {
      return res.status(400).json({ success: false, message: 'Missing required tracking parameters' });
    }

    const alumni = await Alumni.findById(targetAlumniId);
    if (!alumni) {
      return res.status(404).json({ success: false, message: 'Alumni record not found' });
    }

    const milestoneMap = {
      connected: 'connected',
      form_shared: 'formShared',
      formShared: 'formShared',
      details_collected: 'detailsCollected',
      detailsCollected: 'detailsCollected',
      verified: 'verified'
    };

    const targetField = milestoneMap[milestone];
    if (!targetField) {
      return res.status(400).json({ success: false, message: `Invalid milestone: ${milestone}` });
    }

    const updateDoc = {
      $set: {
        [targetField]: Boolean(status),
        studentCoordinator: req.user.id || req.user._id,
        updatedAt: new Date()
      }
    };

    const trackingRecord = await AlumniMonthlyTracking.findOneAndUpdate(
      { alumni: targetAlumniId, year: targetYear, month: targetMonth, weekNumber: targetWeek },
      updateDoc,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Workflow sync with main Alumni model
    if (targetField === 'connected' && Boolean(status)) {
      if (alumni.contactStatus === 'NOT_ATTEMPTED') {
        alumni.contactStatus = 'REACHED_INCOMPLETE';
      }
      await alumni.save();
    } else if (targetField === 'detailsCollected' && Boolean(status)) {
      alumni.contactStatus = 'REACHED_COMPLETE';
      await alumni.save();
    } else if (targetField === 'verified' && Boolean(status)) {
      if (alumni.verificationStage === 'PENDING_SUBMISSION') {
        alumni.verificationStage = 'SUBMITTED_BY_STUDENT';
      }
      alumni.contactStatus = 'REACHED_COMPLETE';
      await alumni.save();
    }

    return res.json({
      success: true,
      message: `Milestone '${milestone}' updated to ${Boolean(status)}`,
      data: trackingRecord
    });
  } catch (error) {
    console.error('Error updating monthly tracking milestone:', error);
    return res.status(500).json({ success: false, message: 'Failed to update monthly tracking milestone', error: error.message });
  }
};

// @desc    Get Student Coordinator Wallet details, balance, cooldown, and payout history
// @route   GET /api/student/wallet, GET /api/alumni/wallet
// @access  Private (Student Coordinator)
const getStudentWallet = async (req, res) => {
  try {
    const studentId = req.user.id || req.user._id;

    // 1. Calculate count of ADMIN_APPROVED records for this student
    const verifiedCount = await Alumni.countDocuments({
      verificationStage: 'ADMIN_APPROVED',
      $or: [
        { assignedTo: studentId },
        { lastUpdatedByStudent: studentId }
      ]
    });

    const ratePerRecord = 10; // ₹10 per verified record
    const totalEarnedAmount = verifiedCount * ratePerRecord;

    // 2. Fetch or initialize StudentWallet document
    let wallet = await StudentWallet.findOne({ student: studentId });
    if (!wallet) {
      wallet = await StudentWallet.create({
        student: studentId,
        totalEarnedAmount,
        withdrawnAmount: 0,
        lastPayoutRequestAt: null
      });
    } else {
      wallet.totalEarnedAmount = totalEarnedAmount;
      await wallet.save();
    }

    const withdrawnAmount = wallet.withdrawnAmount || 0;
    const currentBalance = Math.max(0, totalEarnedAmount - withdrawnAmount);

    // 3. Check pending request
    const pendingRequest = await PayoutRequest.findOne({
      student: studentId,
      status: 'PENDING'
    });

    // 4. Cooldown calculation (90 days / 3 months)
    const COOLDOWN_DAYS = 90;
    let daysRemainingInCooldown = 0;
    let isEligibleForPayout = currentBalance > 0 && !pendingRequest;

    if (wallet.lastPayoutRequestAt) {
      const diffTime = Date.now() - new Date(wallet.lastPayoutRequestAt).getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < COOLDOWN_DAYS) {
        daysRemainingInCooldown = COOLDOWN_DAYS - diffDays;
        isEligibleForPayout = false;
      }
    }

    // 5. Fetch payout history
    const history = await PayoutRequest.find({ student: studentId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: {
        verifiedCount,
        ratePerRecord,
        totalEarnedAmount,
        withdrawnAmount,
        currentBalance,
        lastPayoutRequestAt: wallet.lastPayoutRequestAt,
        isEligibleForPayout,
        daysRemainingInCooldown,
        pendingRequest: !!pendingRequest,
        pendingRequestData: pendingRequest || null,
        history
      }
    });
  } catch (error) {
    console.error('Error fetching student wallet:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve wallet information', error: error.message });
  }
};

// @desc    Request Cheque Validation Payout (Subject to 90-day cooldown & positive balance)
// @route   POST /api/student/request-cheque-payout
// @access  Private (Student Coordinator)
const requestChequePayout = async (req, res) => {
  try {
    const studentId = req.user.id || req.user._id;

    // 1. Calculate count & earned amount
    const verifiedCount = await Alumni.countDocuments({
      verificationStage: 'ADMIN_APPROVED',
      $or: [
        { assignedTo: studentId },
        { lastUpdatedByStudent: studentId }
      ]
    });

    const ratePerRecord = 10;
    const totalEarnedAmount = verifiedCount * ratePerRecord;

    let wallet = await StudentWallet.findOne({ student: studentId });
    if (!wallet) {
      wallet = await StudentWallet.create({
        student: studentId,
        totalEarnedAmount,
        withdrawnAmount: 0,
        lastPayoutRequestAt: null
      });
    }

    const currentBalance = Math.max(0, totalEarnedAmount - wallet.withdrawnAmount);

    if (currentBalance <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance for payout request. You need ADMIN_APPROVED alumni records.'
      });
    }

    // 2. Check existing pending request
    const existingPending = await PayoutRequest.findOne({
      student: studentId,
      status: 'PENDING'
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: 'A cheque validation request is already pending Admin approval.'
      });
    }

    // 3. Check 90-day cooldown
    const COOLDOWN_DAYS = 90;
    if (wallet.lastPayoutRequestAt) {
      const diffTime = Date.now() - new Date(wallet.lastPayoutRequestAt).getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < COOLDOWN_DAYS) {
        const remaining = COOLDOWN_DAYS - diffDays;
        return res.status(400).json({
          success: false,
          message: `Payout request unavailable. Next request available in ${remaining} day(s) (3-month cycle rule).`
        });
      }
    }

    // 4. Insert PayoutRequest & update lastPayoutRequestAt
    const payoutRequest = await PayoutRequest.create({
      student: studentId,
      requestedAmount: currentBalance,
      verifiedRecordsCount: verifiedCount,
      status: 'PENDING',
      requestDate: new Date()
    });

    wallet.lastPayoutRequestAt = new Date();
    await wallet.save();

    return res.status(201).json({
      success: true,
      message: `Cheque validation request submitted for ₹${currentBalance} (${verifiedCount} verified records)!`,
      data: payoutRequest
    });
  } catch (error) {
    console.error('Error submitting payout request:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit payout request', error: error.message });
  }
};

module.exports = {
  getAlumni,
  getAlumniById,
  logCall,
  updateData,
  addRemark,
  getStats,
  inspectAlumni,
  addRemarkPost,
  getStudentRemarks,
  getMonthlyTracking,
  updateMonthlyTracking,
  getStudentWallet,
  requestChequePayout
};
