const mongoose = require('mongoose');

const alumniMonthlyTrackingSchema = new mongoose.Schema({
  alumni: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alumni',
    required: true,
    index: true
  },
  studentCoordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  year: {
    type: Number,
    required: true,
    index: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
    index: true
  },
  weekNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  connected: {
    type: Boolean,
    default: false
  },
  formShared: {
    type: Boolean,
    default: false
  },
  detailsCollected: {
    type: Boolean,
    default: false
  },
  verified: {
    type: Boolean,
    default: false
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Compound unique index ensuring 1 tracking record per alumni per year, month, and weekNumber
alumniMonthlyTrackingSchema.index(
  { alumni: 1, year: 1, month: 1, weekNumber: 1 }, 
  { unique: true }
);

module.exports = mongoose.model('AlumniMonthlyTracking', alumniMonthlyTrackingSchema);
