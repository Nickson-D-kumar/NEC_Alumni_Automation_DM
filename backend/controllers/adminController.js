const Alumni = require('../models/Alumni');
const User = require('../models/User');
const StudentWallet = require('../models/StudentWallet');
const PayoutRequest = require('../models/PayoutRequest');
const bcrypt = require('bcryptjs');
const { parseExcelBuffer, parseMasterSheetAlumni } = require('../utils/excelParser');

// @desc    Master Sheet Upload & Alumni Data Ingestion Pipeline
// @route   POST /api/admin/upload-master-sheet, POST /api/admin/upload-excel
// @access  Private (Admin)
const uploadMasterSheet = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a Master Sheet (.xlsx, .xls, .csv) file' });
    }

    const {
      targetSheetName,
      isDedicatedSheet,
      sheetNamesScanned,
      totalRowsScanned,
      parsedAlumni,
      validationErrors
    } = parseMasterSheetAlumni(req.file.buffer);

    if (!parsedAlumni || parsedAlumni.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid Alumni records were found in the uploaded file.',
        details: {
          sheetsScanned: sheetNamesScanned,
          totalRowsScanned,
          validationErrors
        }
      });
    }

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = validationErrors.length;
    const processingErrors = [...validationErrors];

    for (const record of parsedAlumni) {
      const { rowIndex, ...data } = record;
      try {
        // Multi-tier unique matching priority: 1) email, 2) regNo + batch, 3) mobile + batch, 4) name + batch
        let existing = null;
        if (data.email && data.email.length > 0) {
          existing = await Alumni.findOne({ email: data.email });
        }
        if (!existing && data.regNo) {
          existing = await Alumni.findOne({ regNo: data.regNo, batch: data.batch });
        }
        if (!existing && data.mobile && data.mobile !== '0000000000') {
          existing = await Alumni.findOne({ mobile: data.mobile, batch: data.batch });
        }
        if (!existing && data.name && data.batch) {
          existing = await Alumni.findOne({ name: data.name, batch: data.batch });
        }

        if (existing) {
          await Alumni.findByIdAndUpdate(existing._id, { $set: data });
          updatedCount++;
        } else {
          await Alumni.create(data);
          insertedCount++;
        }
      } catch (err) {
        skippedCount++;
        processingErrors.push({ row: rowIndex, email: data.email || data.name, reason: err.message });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Master Sheet Data Ingestion Complete! Inserted ${insertedCount} new alumni, updated ${updatedCount} existing records.`,
      summary: {
        totalSheetsScanned: sheetNamesScanned.length,
        sheetsScanned: sheetNamesScanned,
        targetSheetName,
        isDedicatedSheet,
        totalRowsScanned,
        totalAlumniParsed: parsedAlumni.length,
        insertedCount,
        updatedCount,
        skippedCount,
        errorCount: processingErrors.length,
        errors: processingErrors
      }
    });
  } catch (error) {
    console.error('Master Sheet Ingestion Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to parse and ingest Master Sheet data.',
      error: error.message
    });
  }
};

// @desc    Get List of Alumni Pending Admin Approval (Verified by Back Officer)
// @route   GET /api/admin/pending-approvals
// @access  Private (Admin)
const getPendingApprovals = async (req, res) => {
  try {
    const pendingList = await Alumni.find({
      $or: [
        { verificationStage: 'VERIFIED_BY_BACK_OFFICER' },
        { verificationStage: 'VERIFIED_BY_HEAD' }
      ]
    })
      .populate('verifiedByBackOfficer', 'name email department')
      .populate('assignedTo', 'name email department')
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: pendingList.length,
      data: pendingList
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve pending approvals', error: error.message });
  }
};

// @desc    Final Admin Approval for Single Record
// @route   POST /api/admin/approve/:id, PUT /api/alumni/:id/admin-approve
// @access  Private (Admin)
const adminApprove = async (req, res) => {
  try {
    const alumni = await Alumni.findById(req.params.id);

    if (!alumni) {
      return res.status(404).json({ success: false, message: 'Alumni record not found' });
    }

    alumni.verificationStage = 'ADMIN_APPROVED';
    
    alumni.adminRemarks.push({
      sender: req.user.id || req.user._id,
      role: req.user.role,
      message: `Final Approval granted by Administrator (${req.user.name})`,
      createdAt: new Date()
    });

    await alumni.save();

    const updated = await Alumni.findById(req.params.id)
      .populate('verifiedByBackOfficer', 'name email')
      .populate('assignedTo', 'name email')
      .populate('adminRemarks.sender', 'name role');

    return res.json({
      success: true,
      message: 'Record granted final ADMIN_APPROVED status!',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error approving record', error: error.message });
  }
};

// @desc    Bulk Admin Approve Back-Officer-Verified Records
// @route   PUT /api/admin/bulk-approve
// @access  Private (Admin)
const bulkApprove = async (req, res) => {
  try {
    const { ids } = req.body;
    let query = { 
      $or: [
        { verificationStage: 'VERIFIED_BY_BACK_OFFICER' },
        { verificationStage: 'VERIFIED_BY_HEAD' }
      ]
    };

    if (ids && Array.isArray(ids) && ids.length > 0) {
      query = {
        _id: { $in: ids },
        ...query
      };
    }

    const result = await Alumni.updateMany(
      query,
      { $set: { verificationStage: 'ADMIN_APPROVED' } }
    );

    return res.json({
      success: true,
      message: `Bulk approval complete! ${result.modifiedCount} records updated to ADMIN_APPROVED.`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Bulk approval failed', error: error.message });
  }
};

// @desc    Get all registered system users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.json({ success: true, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching users', error: error.message });
  }
};

// @desc    Create new system user
// @route   POST /api/admin/users
// @access  Private (Admin)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, department, assignedBatch, mobile } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please fill all required user fields' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      mobile: mobile || '+910000000000',
      department: department || 'CSE',
      registrationStatus: 'APPROVED',
      assignedBatch: assignedBatch || []
    });

    return res.status(201).json({
      success: true,
      message: `User ${user.name} created successfully as ${user.role}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error creating user', error: error.message });
  }
};

// @desc    Get pending student registrations (Exclusively Admin)
// @route   GET /api/users/pending-students, GET /api/admin/pending-students
// @access  Private (Admin)
const getPendingStudents = async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student registration approvals are exclusively reserved for System Administrator.'
      });
    }

    const query = { role: 'STUDENT_COORDINATOR', registrationStatus: 'PENDING_APPROVAL' };
    const pendingStudents = await User.find(query).select('-password').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: pendingStudents });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve or Reject Student Registration (Exclusively Admin)
// @route   PUT /api/users/verify-student/:id, PUT /api/admin/verify-student/:id
// @access  Private (Admin)
const verifyStudentRegistration = async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only System Administrator can approve or reject student registration requests.'
      });
    }

    const { action } = req.body; // 'APPROVE' or 'REJECT'
    const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    const userId = req.user._id || req.user.id;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        registrationStatus: status,
        approvedBy: userId,
        approvalDate: new Date()
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'Student account not found' });
    }

    return res.status(200).json({ 
      success: true, 
      message: `Student registration ${status.toLowerCase()}`, 
      data: updatedUser 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin Add Student Coordinator (with Department, Year & Mobile Number)
// @route   POST /api/admin/create-student
// @access  Private (Admin)
const createStudentCoordinator = async (req, res) => {
  try {
    const { name, email, password, mobile, department, year } = req.body;

    if (!name || !email || !password || !mobile || !department || !year) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, password, mobile number, department, and year are required.' 
      });
    }

    const cleanMobile = String(mobile).trim();
    if (!/^[0-9]{10}$/.test(cleanMobile)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid 10-digit mobile number.' 
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userId = req.user?._id || req.user?.id;

    const newStudent = new User({
      name: String(name).trim(),
      email: cleanEmail,
      password: hashedPassword,
      mobile: cleanMobile,
      department,
      year,
      role: 'STUDENT_COORDINATOR',
      registrationStatus: 'APPROVED',
      approvedBy: userId,
      approvalDate: new Date(),
      isActive: true
    });

    await newStudent.save();

    return res.status(201).json({
      success: true,
      message: `Student Coordinator added for ${department} (${year})!`,
      data: {
        id: newStudent._id,
        name: newStudent.name,
        email: newStudent.email,
        mobile: newStudent.mobile,
        department: newStudent.department,
        year: newStudent.year,
        role: newStudent.role
      }
    });
  } catch (error) {
    console.error('Error creating student coordinator:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get All Student Cheque Validation Payout Requests
// @route   GET /api/admin/payout-requests
// @access  Private (Admin)
const getPayoutRequests = async (req, res) => {
  try {
    const requests = await PayoutRequest.find()
      .populate('student', 'name email department mobile year')
      .populate('processedByAdmin', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching payout requests:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve payout requests', error: error.message });
  }
};

// @desc    Process / Approve Student Cheque Validation Payout Request
// @route   PUT /api/admin/payout-requests/:id/process
// @access  Private (Admin)
const processPayoutRequest = async (req, res) => {
  try {
    const { action, adminNotes } = req.body; // 'APPROVE' or 'REJECT'
    const payoutId = req.params.id;
    const adminId = req.user.id || req.user._id;

    const payout = await PayoutRequest.findById(payoutId);
    if (!payout) {
      return res.status(404).json({ success: false, message: 'Payout request not found' });
    }

    if (payout.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Payout request is already ${payout.status.toLowerCase()}` });
    }

    if (action === 'APPROVE') {
      payout.status = 'APPROVED_CHEQUE_ISSUED';
      payout.processedAt = new Date();
      payout.processedByAdmin = adminId;
      if (adminNotes) payout.adminNotes = adminNotes;
      await payout.save();

      // Deduct/update withdrawn amount in StudentWallet
      await StudentWallet.findOneAndUpdate(
        { student: payout.student },
        { $inc: { withdrawnAmount: payout.requestedAmount } },
        { upsert: true }
      );

      return res.json({
        success: true,
        message: `Payout request approved! Cheque issued for ₹${payout.requestedAmount}.`,
        data: payout
      });
    } else if (action === 'REJECT') {
      payout.status = 'REJECTED';
      payout.processedAt = new Date();
      payout.processedByAdmin = adminId;
      if (adminNotes) payout.adminNotes = adminNotes;
      await payout.save();

      return res.json({
        success: true,
        message: 'Payout request rejected.',
        data: payout
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action parameter' });
    }
  } catch (error) {
    console.error('Error processing payout request:', error);
    return res.status(500).json({ success: false, message: 'Failed to process payout request', error: error.message });
  }
};

module.exports = {
  uploadMasterSheet,
  uploadExcel: uploadMasterSheet,
  getPendingApprovals,
  adminApprove,
  approveAlumni: adminApprove,
  bulkApprove,
  getUsers,
  createUser,
  createStudentCoordinator,
  getPendingStudents,
  verifyStudentRegistration,
  getPayoutRequests,
  processPayoutRequest
};
