const mongoose = require('mongoose');

const coordinatorReminderLogSchema = new mongoose.Schema({
  staff_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  student_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  sent_at: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  pending_count: { 
    type: Number, 
    default: 0 
  },
  status: { 
    type: String, 
    enum: ['SENT', 'FAILED'], 
    default: 'SENT' 
  },
  message_id: {
    type: String
  }
}, { 
  timestamps: true,
  collection: 'coordinator_reminder_logs'
});

module.exports = mongoose.models.CoordinatorReminderLog || mongoose.model('CoordinatorReminderLog', coordinatorReminderLogSchema);
