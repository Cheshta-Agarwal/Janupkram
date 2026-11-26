const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    role: { type: String, trim: true },
    department: { type: String, trim: true },
  },
  { _id: false }
);

const milestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
    },
    deliverableUrl: { type: String, trim: true, default: '' },
    completedAt: { type: Date },
  },
  { _id: true }
);

const budgetEntrySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, default: 'Hardware & Prototyping', trim: true },
    amount: { type: Number, required: true, min: 0 },
    invoiceUrl: { type: String, default: '', trim: true },
    loggedByName: { type: String, default: '' },
  },
  { timestamps: true }
);

const proposalSchema = new mongoose.Schema(
  {
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge',
      required: true,
    },
    universityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    teamName: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
    },
    facultyMentor: {
      type: String,
      required: [true, 'Faculty mentor is required'],
      trim: true,
    },
    members: {
      type: [memberSchema],
      default: [],
    },
    abstract: {
      type: String,
      required: [true, 'Abstract is required'],
      trim: true,
    },
    methodology: {
      type: String,
      required: [true, 'Methodology is required'],
      trim: true,
    },
    expectedImpact: {
      type: String,
      required: [true, 'Expected impact is required'],
      trim: true,
    },
    estimatedBudget: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['submitted', 'approved', 'revision_requested'],
      default: 'approved',
    },
    milestones: {
      type: [milestoneSchema],
      default: [],
    },
    budgetEntries: {
      type: [budgetEntrySchema],
      default: [],
    },
  },
  { timestamps: true }
);

proposalSchema.index({ challengeId: 1, universityId: 1 });

module.exports = mongoose.model('Proposal', proposalSchema);
