const mongoose = require('mongoose');

const CHALLENGE_CATEGORIES = [
  'education',
  'healthcare',
  'agriculture',
  'sanitation',
  'environment',
  'infrastructure',
  'other',
];

const CHALLENGE_STATUSES = [
  'submitted',
  'under_review',
  'validated',
  'rejected',
  'routed',
  'team_formed',
  'in_progress',
  'piloted',
  'deployed',
];

const escalationSchema = new mongoose.Schema(
  {
    authorityName: { type: String, required: true, trim: true },
    authorityHandle: { type: String, default: '', trim: true },
    department: { type: String, default: '', trim: true },
    channel: {
      type: String,
      enum: ['x_post', 'cpgrams', 'email', 'municipal_portal'],
      default: 'cpgrams',
    },
    message: { type: String, required: true, trim: true },
    portalUrl: { type: String, default: '' },
    escalatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    escalatedByName: { type: String, default: '' },
    status: {
      type: String,
      enum: ['dispatched', 'acknowledged', 'resolved_by_authority'],
      default: 'dispatched',
    },
  },
  { timestamps: true }
);

const challengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    category: {
      type: String,
      enum: CHALLENGE_CATEGORIES,
      required: [true, 'Category is required'],
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    district: {
      type: String,
      required: true,
      default: 'Phagwara',
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },
    media: {
      type: [String],
      default: [],
    },
    sourcePlatform: {
      type: String,
      default: 'Direct Report',
      trim: true,
    },
    sourceUrl: {
      type: String,
      default: '',
      trim: true,
    },
    externalTicketId: {
      type: String,
      default: '',
      trim: true,
    },
    escalations: {
      type: [escalationSchema],
      default: [],
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedUniversity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge',
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: CHALLENGE_STATUSES,
      default: 'submitted',
    },
    upvotes: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
  },
  { timestamps: true }
);

challengeSchema.index({ location: '2dsphere' });
challengeSchema.index({ status: 1, category: 1, district: 1 });

module.exports = mongoose.model('Challenge', challengeSchema);
module.exports.CHALLENGE_CATEGORIES = CHALLENGE_CATEGORIES;
module.exports.CHALLENGE_STATUSES = CHALLENGE_STATUSES;
