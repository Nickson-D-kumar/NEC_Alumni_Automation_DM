const Alumni = require('../models/Alumni');
const User = require('../models/User');
const StudentWallet = require('../models/StudentWallet');
const PayoutRequest = require('../models/PayoutRequest');
const bcrypt = require('bcryptjs');
const { parseExcelBuffer, parseMasterSheetAlumni } = require('../utils/excelParser');

// Helper to recursively flatten an object for MongoDB $set without overwriting existing data with empty/null/undefined values
const buildNonDestructivePatch = (data) => {
  const patch = {};

  const traverse = (obj, prefix = '') => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      const path = prefix ? `${prefix}.${key}` : key;

      if (key === 'rowIndex' || key === '_id') continue;
      if (val === null || val === undefined) continue;

      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed.length > 0) {
          patch[path] = trimmed;
        }
      } else if (val instanceof Date) {
        if (!isNaN(val.getTime())) {
          patch[path] = val;
        }
      } else if (Array.isArray(val)) {
        if (val.length > 0) {
          patch[path] = val;
        }
      } else if (typeof val === 'object') {
        traverse(val, path);
      } else if (typeof val === 'number' || typeof val === 'boolean') {
        patch[path] = val;
      }
    }
  };

  traverse(data);
  return patch;
};

// @desc    Master Sheet Upload & Alumni Data Ingestion Pipeline with Deduplication
// @route   POST /api/admin/upload-master-sheet, POST /api/admin/upload-excel, POST /api/admin/alumni/upload
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

    const processingErrors = [...validationErrors];
    const duplicateRecords = [];

    if (!parsedAlumni || parsedAlumni.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid Alumni records were found in the uploaded file.',
        stats: {
          totalRows: totalRowsScanned || 0,
          insertedCount: 0,
          updatedCount: 0,
          duplicateCount: 0,
          failedCount: validationErrors.length
        },
        duplicateRecords: [],
        details: {
          sheetsScanned: sheetNamesScanned,
          totalRowsScanned,
          validationErrors
        }
      });
    }

    // 1. IN-FILE DEDUPLICATION (File Pre-processing Phase)
    // Priority: email_id first, fallback to normalized mobile_phone_no
    const activeRecords = [];
    const emailToActiveMap = new Map();
    const mobileToActiveMap = new Map();
    let fileDuplicateCount = 0;

    for (const record of parsedAlumni) {
      const email = record.email ? String(record.email).trim().toLowerCase() : '';
      const mobile = (record.mobile && record.mobile !== '0000000000' && record.mobile.length === 10) ? String(record.mobile) : '';

      let duplicatePrev = null;
      let dupKeyType = '';

      if (email && emailToActiveMap.has(email)) {
        duplicatePrev = emailToActiveMap.get(email);
        dupKeyType = 'email';
      } else if (!email && mobile && mobileToActiveMap.has(mobile)) {
        duplicatePrev = mobileToActiveMap.get(mobile);
        dupKeyType = 'phone number';
      }

      if (duplicatePrev) {
        fileDuplicateCount++;
        duplicateRecords.push({
          row: duplicatePrev.rowIndex,
          name: duplicatePrev.name || 'Unknown',
          identifier: duplicatePrev.email || duplicatePrev.mobile || 'N/A',
          type: 'IN_FILE_DUPLICATE',
          reason: `Duplicate ${dupKeyType} inside uploaded file (earlier row skipped)`
        });

        const prevIdx = activeRecords.findIndex(r => r.rowIndex === duplicatePrev.rowIndex);
        if (prevIdx !== -1) {
          activeRecords.splice(prevIdx, 1);
        }

        if (duplicatePrev.email) emailToActiveMap.delete(duplicatePrev.email.toLowerCase());
        if (duplicatePrev.mobile) mobileToActiveMap.delete(duplicatePrev.mobile);
      }

      activeRecords.push(record);
      if (email) emailToActiveMap.set(email, record);
      if (mobile) mobileToActiveMap.set(mobile, record);
    }

    // 2. DATABASE COMPARISON & BATCH PROCESSING
    const uniqueEmails = Array.from(new Set(activeRecords.map(r => r.email).filter(Boolean)));
    const uniqueMobiles = Array.from(new Set(activeRecords.map(r => r.mobile).filter(m => m && m !== '0000000000' && m.length === 10)));

    let existingDbRecords = [];
    if (uniqueEmails.length > 0 || uniqueMobiles.length > 0) {
      const orConditions = [];
      if (uniqueEmails.length > 0) orConditions.push({ email: { $in: uniqueEmails } });
      if (uniqueMobiles.length > 0) orConditions.push({ mobile: { $in: uniqueMobiles } });

      existingDbRecords = await Alumni.find({ $or: orConditions }).lean();
    }

    const dbEmailMap = new Map();
    const dbMobileMap = new Map();

    existingDbRecords.forEach(dbRec => {
      if (dbRec.email) dbEmailMap.set(String(dbRec.email).trim().toLowerCase(), dbRec);
      if (dbRec.mobile && dbRec.mobile !== '0000000000') dbMobileMap.set(String(dbRec.mobile), dbRec);
    });

    let insertedCount = 0;
    let updatedCount = 0;
    let dbDuplicateCount = 0;
    let failedCount = validationErrors.length;

    for (const record of activeRecords) {
      const { rowIndex, ...data } = record;
      const email = data.email ? String(data.email).trim().toLowerCase() : '';
      const mobile = (data.mobile && data.mobile !== '0000000000' && data.mobile.length === 10) ? String(data.mobile) : '';

      let existingDb = null;
      if (email && dbEmailMap.has(email)) {
        existingDb = dbEmailMap.get(email);
      } else if (mobile && dbMobileMap.has(mobile)) {
        existingDb = dbMobileMap.get(mobile);
      }

      if (existingDb) {
        try {
          const patchData = buildNonDestructivePatch(data);
          if (Object.keys(patchData).length > 0) {
            await Alumni.findByIdAndUpdate(existingDb._id, { $set: patchData });
          }
          updatedCount++;
          dbDuplicateCount++;
          duplicateRecords.push({
            row: rowIndex,
            name: data.name || 'Unknown',
            identifier: email || mobile || 'N/A',
            type: 'DATABASE_DUPLICATE',
            reason: 'Record already exists in system database (data updated)'
          });
        } catch (err) {
          failedCount++;
          processingErrors.push({ row: rowIndex, email: email || data.name, reason: err.message });
        }
      } else {
        try {
          const newDoc = await Alumni.create(data);
          insertedCount++;
          if (email) dbEmailMap.set(email, newDoc.toObject ? newDoc.toObject() : newDoc);
          if (mobile) dbMobileMap.set(mobile, newDoc.toObject ? newDoc.toObject() : newDoc);
        } catch (err) {
          failedCount++;
          processingErrors.push({ row: rowIndex, email: email || data.name, reason: err.message });
        }
      }
    }

    duplicateRecords.sort((a, b) => (a.row || 0) - (b.row || 0));

    const totalRows = totalRowsScanned || (parsedAlumni.length + validationErrors.length);
    const totalDuplicates = fileDuplicateCount + dbDuplicateCount;

    return res.status(200).json({
      success: true,
      message: `Master Sheet Data Ingestion Complete! Inserted ${insertedCount} new records, updated ${updatedCount} existing records, handled ${totalDuplicates} duplicates.`,
      stats: {
        totalRows,
        insertedCount,
        updatedCount,
        duplicateCount: totalDuplicates,
        failedCount
      },
      duplicateRecords,
      summary: {
        totalSheetsScanned: sheetNamesScanned.length,
        sheetsScanned: sheetNamesScanned,
        targetSheetName,
        isDedicatedSheet,
        totalRowsScanned: totalRows,
        totalAlumniParsed: parsedAlumni.length,
        insertedCount,
        updatedCount,
        duplicateCount: totalDuplicates,
        skippedCount: failedCount,
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

// @desc    Toggle User Status (Activate / Deactivate)
// @route   PATCH /api/admin/users/:userId/status, PUT /api/admin/users/:userId/status
// @access  Private (Admin)
const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id || req.user._id;

    // Self-Deactivation Guard
    if (adminId.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own admin account.'
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    targetUser.isActive = !targetUser.isActive;
    await targetUser.save();

    const statusText = targetUser.isActive ? 'activated' : 'deactivated';
    return res.json({
      success: true,
      message: `User ${targetUser.name} has been ${statusText} successfully.`,
      data: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        isActive: targetUser.isActive
      }
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user status', error: error.message });
  }
};

// @desc    Delete User Account
// @route   DELETE /api/admin/users/:userId
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id || req.user._id;

    // Self-Deletion Guard
    if (adminId.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own admin account.'
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    // Reassign/nullify linked relations
    await Alumni.updateMany({ assignedTo: userId }, { $set: { assignedTo: null } });

    await User.findByIdAndDelete(userId);

    return res.json({
      success: true,
      message: `User ${targetUser.name} (${targetUser.email}) deleted successfully.`
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete user account', error: error.message });
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
  processPayoutRequest,
  toggleUserStatus,
  deleteUser
};
