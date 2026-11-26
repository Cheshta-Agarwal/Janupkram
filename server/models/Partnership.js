const mongoose = require('mongoose');

const partnershipSchema = new mongoose.Schema(
  {
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge',
      required: true,
    },
    proposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      default: null,
    },
    industryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collaborationType: {
      type: String,
      enum: ['mentorship', 'funding', 'prototyping_support', 'field_deployment'],
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Partnership title is required'],
      trim: true,
    },
    commitmentDetails: {
      type: String,
      required: [true, 'Commitment details are required'],
      trim: true,
    },
    fundingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['proposed', 'accepted', 'declined', 'completed'],
      default: 'proposed',
    },
  },
  { timestamps: true }
);

partnershipSchema.index({ challengeId: 1, industryId: 1 });

module.exports = mongoose.model('Partnership', partnershipSchema);
