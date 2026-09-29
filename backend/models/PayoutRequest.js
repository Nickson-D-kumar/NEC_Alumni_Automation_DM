const mongoose = require('mongoose');

const payoutRequestSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  requestedAmount: {
    type: Number,
    required: true
  },
  verifiedRecordsCount: {
    type: Number,
    required: true
  },
  requestDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED_CHEQUE_ISSUED', 'REJECTED'],
    default: 'PENDING',
    index: true
  },
  adminNotes: {
    type: String,
    default: ''
  },
  processedAt: {
    type: Date
  },
  processedByAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('PayoutRequest', payoutRequestSchema);
