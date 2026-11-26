const mongoose = require('mongoose');

const verificationDocSchema = new mongoose.Schema(
  {
    docType: {
      type: String,
      enum: ['gov_id', 'aishe_naac', 'ngo_darpan', 'cin_csr1', 'other'],
      required: true,
    },
    docNumber: { type: String, trim: true, default: '' },
    fileUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['citizen', 'admin', 'university', 'industry'],
      required: [true, 'Role is required'],
    },
    organizationName: {
      type: String,
      default: '',
      trim: true,
    },
    district: {
      type: String,
      default: 'Phagwara',
      trim: true,
    },
    specializations: {
      type: [String],
      default: [],
    },
    // Rich Stakeholder Profile & KYC Verification
    bio: { type: String, default: '', trim: true },
    portfolioUrl: { type: String, default: '', trim: true },
    githubUrl: { type: String, default: '', trim: true },
    wardOrConstituency: { type: String, default: '', trim: true },
    aisheOrNaacCode: { type: String, default: '', trim: true },
    labCapabilities: { type: [String], default: [] },
    cinOrGstin: { type: String, default: '', trim: true },
    csrFocusAreas: { type: [String], default: [] },
    mentorshipSlots: { type: Number, default: 0, min: 0 },
    designation: { type: String, default: '', trim: true },
    jurisdiction: { type: String, default: '', trim: true },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending_review', 'verified', 'rejected'],
      default: 'unverified',
    },
    verificationFeedback: { type: String, default: '', trim: true },
    verificationDocuments: {
      type: [verificationDocSchema],
      default: [],
    },
    civicKarma: { type: Number, default: 10, min: 0 },
    endorsements: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
  },
  { timestamps: true }
);

userSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    organizationName: this.organizationName,
    district: this.district,
    specializations: this.specializations,
    bio: this.bio,
    portfolioUrl: this.portfolioUrl,
    githubUrl: this.githubUrl,
    wardOrConstituency: this.wardOrConstituency,
    aisheOrNaacCode: this.aisheOrNaacCode,
    labCapabilities: this.labCapabilities,
    cinOrGstin: this.cinOrGstin,
    csrFocusAreas: this.csrFocusAreas,
    mentorshipSlots: this.mentorshipSlots,
    designation: this.designation,
    jurisdiction: this.jurisdiction,
    verificationStatus: this.verificationStatus,
    verificationFeedback: this.verificationFeedback,
    verificationDocuments: this.verificationDocuments,
    civicKarma: this.civicKarma,
    endorsementsCount: Array.isArray(this.endorsements) ? this.endorsements.length : 0,
    endorsements: this.endorsements,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
