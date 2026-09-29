const mongoose = require('mongoose');

const studentWalletSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  totalEarnedAmount: {
    type: Number,
    default: 0
  },
  withdrawnAmount: {
    type: Number,
    default: 0
  },
  lastPayoutRequestAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('StudentWallet', studentWalletSchema);
