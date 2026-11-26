const mongoose = require('mongoose');

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
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
