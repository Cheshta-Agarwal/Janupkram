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
