const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Student Coordinator Self-Registration
// @route   POST /api/auth/student-register, POST /api/auth/register
// @access  Public
const studentRegister = async (req, res) => {
  console.log("👉 Registration payload received:", req.body);
  try {
    const { name, email, password, mobile, department, year } = req.body;

    // 1. Validate required fields
    if (!name || !email || !password || !mobile || !department || !year) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields. Please fill name, department, year, mobile, email, and password.' 
      });
    }

    const cleanMobile = String(mobile).trim();
    // 2. Validate mobile number
    if (!/^[0-9]{10}$/.test(cleanMobile)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid 10-digit mobile number.' 
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    // 3. Check for existing user
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'An account with this email already exists.' 
      });
    }

    // 4. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Create user awaiting approval
    const newStudent = new User({
      name: String(name).trim(),
      email: cleanEmail,
      password: hashedPassword,
      mobile: cleanMobile,
      department,
      year,
      role: 'STUDENT_COORDINATOR',
      registrationStatus: 'PENDING_APPROVAL',
      isActive: true
    });

    await newStudent.save();
    console.log("✅ Student registered successfully:", newStudent.email);

    return res.status(201).json({
      success: true,
      message: 'Registration submitted successfully! Your account is pending verification by the Head Officer / Admin.'
    });

  } catch (error) {
    console.error("❌ Registration Server Error:", error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error during registration.' 
    });
  }
};

// @desc    Unified Login (Single Email/Password Input, Dynamic Role Detection)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    // Find user by email (case-insensitive & trimmed)
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated. Contact Admin.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(cleanPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Block unapproved student accounts per spec
    if (user.role === 'STUDENT_COORDINATOR' && user.registrationStatus !== 'APPROVED') {
      return res.status(403).json({ 
        success: false, 
        message: `Account is ${user.registrationStatus.toLowerCase().replace('_', ' ')}. Please contact your Head Officer or Admin.` 
      });
    }

    // Generate JWT payload with role embedded
    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      },
      process.env.JWT_SECRET || 'crm_super_secret_jwt_key_2026',
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      role: user.role,
      name: user.name,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        assignedBatch: user.assignedBatch
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during authentication', error: error.message });
  }
};

// @desc    Get current authenticated user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    return res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching profile', error: error.message });
  }
};

module.exports = { studentRegister, login, getMe };
