const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge',
      required: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actorName: {
      type: String,
      required: true,
    },
    actorRole: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    fromStatus: {
      type: String,
      default: '',
    },
    toStatus: {
      type: String,
      default: '',
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

activityLogSchema.index({ challengeId: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
