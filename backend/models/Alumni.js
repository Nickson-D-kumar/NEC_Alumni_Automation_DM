const mongoose = require('mongoose');

const alumniSchema = new mongoose.Schema({
  // 1. Personal Information
  name: { type: String, required: true, index: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
  mobile: { type: String, required: true, index: true }, // mobile_phone_no
  dob: Date, // date_of_birth
  email: { type: String, lowercase: true, trim: true, index: true }, // email_id
  label: String, // Label / Tag
  profileUpdatedOn: Date, // profile_updated_on

  // 2. Location & Address Details
  currentLocation: String, // current_location
  homeTown: String, // home_town
  areaInCityTownLocation: String, // area_in_city_town_location
  chapter: String, // chapter
  address: {
    correspondenceAddress: String,
    city: String,
    state: String,
    country: String,
    pincode: String
  },

  // 3. Academic Background
  batch: { type: String, required: true, index: true }, // end_year / batch
  graduationYear: { type: String },
  department: { type: String, default: 'CSE' },
  degree: { type: String, default: 'B.Tech' },
  educationalCourse: String, // educational_course
  educationalInstitute: String, // educational_institute
  startYear: String, // start_year
  endYear: String, // end_year

  // 4. Professional Details & Experience
  professional: {
    company: String,
    position: String,
    experienceYears: Number, // work_experience_years
    skills: [String], // professional_skills
    rolesPlayed: String, // roles_played
    industriesWorkedIn: String // industries_worked_in
  },
  socials: {
    linkedin: String, // linkedin_link
    facebook: String // facebook_link
  },

  // 5. Engagement & Contribution Preferences
  contributions: {
    mentorStudents: { type: Boolean, default: false }, // would_you_like_to_mentor
    webinarSpeaker: { type: Boolean, default: false }, // would_you_like_to_be_a_volunteer
    scholarships: { type: Boolean, default: false } // contribute_to_scholarships
  },

  // System Tracking & Workflow Attributes
  chamberId: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedAt: { type: Date, default: null },
  lastUpdatedByStudent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastContactedAt: Date,
  contactStatus: { 
    type: String, 
    enum: ['NOT_ATTEMPTED', 'REACHED_COMPLETE', 'REACHED_INCOMPLETE', 'NOT_REACHED'], 
    default: 'NOT_ATTEMPTED',
    index: true
  },
  escalationLevel: {
    type: String,
    enum: ['NONE', 'LEVEL_2_STAFF', 'LEVEL_3_HOD', 'LEVEL_4_CHAMBER_HEAD'],
    default: 'NONE',
    index: true
  },
  verificationStage: {
    type: String,
    enum: ['PENDING_SUBMISSION', 'SUBMITTED_BY_STUDENT', 'REVISION_REQUESTED', 'VERIFIED_BY_BACK_OFFICER', 'VERIFIED_BY_HEAD', 'ADMIN_APPROVED', 'VERIFICATION_REJECTED'],
    default: 'PENDING_SUBMISSION',
    index: true
  },
  originalData: { type: mongoose.Schema.Types.Mixed, default: null },
  submittedAt: Date,
  verifiedByBackOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  backOfficerVerificationDate: Date,
  rejectedByBackOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  backOfficerRejectionDate: Date,
  rejectionReason: String,
  backOfficerRemarks: String,
  adminRemarks: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: String,
    message: String,
    createdAt: { type: Date, default: Date.now }
  }],
  callLogs: [{
    timestamp: { type: Date, default: Date.now },
    channel: { type: String, enum: ['CALL', 'WHATSAPP', 'EMAIL'] },
    outcome: { type: String, enum: ['ATTENDED', 'INVALID_NUMBER', 'NOT_CONNECTED', 'SWITCHED_OFF'] },
    remarks: String,
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
}, { timestamps: true });

alumniSchema.index({ verificationStage: 1, contactStatus: 1, updatedAt: -1 });

module.exports = mongoose.models.Alumni || mongoose.model('Alumni', alumniSchema);
