// server/models/Submission.js
const mongoose = require('mongoose');

const SubmissionFileSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: null },
    filename: { type: String, default: '' },
    type: { type: String, default: 'file' },
  },
  { _id: false }
);

const SUBMISSION_STATUS = ['submitted', 'graded', 'late', 'resubmitted'];

const SubmissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    files: {
      type: [SubmissionFileSchema],
      default: [],
    },
    textAnswer: {
      type: String,
      default: '',
      maxlength: 10000,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    grade: {
      type: Number,
      min: 0,
      default: null,
    },
    feedback: {
      type: String,
      default: '',
      maxlength: 5000,
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: SUBMISSION_STATUS,
      default: 'submitted',
      index: true,
    },
  },
  { timestamps: true }
);

// Ensure one submission per student per assignment
SubmissionSchema.index(
  { assignment: 1, student: 1 },
  { unique: true }
);

// Mark as late if submitted after dueDate
SubmissionSchema.pre('save', async function markLate(next) {
  try {
    if (!this.isModified('submittedAt') && !this.isNew) return next();
    // Lazy load dueDate for comparison
    const Assignment = mongoose.model('Assignment');
    const assignmentDoc = await Assignment.findById(this.assignment).lean();
    if (assignmentDoc?.dueDate && this.submittedAt > assignmentDoc.dueDate) {
      this.status = 'late';
    }
    return next();
  } catch (err) {
    return next(err);
  }
});

module.exports = mongoose.model('Submission', SubmissionSchema);
