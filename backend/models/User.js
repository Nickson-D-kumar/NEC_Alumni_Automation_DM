const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true },
  mobile: { type: String, required: true, trim: true, default: '+910000000000' },
  department: { type: String, required: true, default: 'CSE' },
  year: { type: String, required: true, default: '3rd Year' },
  role: { 
    type: String, 
    enum: ['STUDENT_COORDINATOR', 'STAFF_COORDINATOR', 'CHAMBER_BACK_OFFICER', 'HEAD_OFFICER', 'ADMIN'],
    default: 'STUDENT_COORDINATOR' 
  },
  registrationStatus: {
    type: String,
    enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED'],
    default: 'PENDING_APPROVAL',
    index: true
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvalDate: Date,
  assignedBatch: [String],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
