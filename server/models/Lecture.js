// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const ROLES = ['student', 'instructor', 'admin'];

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 100,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: true,
      match:
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      type: String,
      minlength: 6,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ROLES,
      default: 'student',
      index: true,
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      maxlength: 500,
      default: '',
    },
    enrolledCourses: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Course', index: true },
    ],
    teachingCourses: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Course', index: true },
    ],
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verificationToken: {
      type: String,
      default: null,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      default: null,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
      select: false,
    },
  },
  { timestamps: true }
);

// Hash password if modified
UserSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  try {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method to compare passwords
UserSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Hide sensitive fields in JSON
UserSchema.set('toJSON', {
  transform: function (_doc, ret) {
    delete ret.password;
    delete ret.verificationToken;
    delete ret.resetPasswordToken;
    delete ret.__v;
    return ret;
  },
});

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1, isVerified: 1 });

module.exports = mongoose.model('User', UserSchema);
