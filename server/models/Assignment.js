// server/models/Assignment.js
const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: null },
    filename: { type: String, default: '' },
    type: { type: String, default: 'file' }, // file | image | link
  },
  { _id: false }
);

const AssignmentSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      required: true,
      minlength: 3,
      maxlength: 200,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      required: true,
      maxlength: 5000,
    },
    dueDate: {
      type: Date,
      required: false,
      index: true,
    },
    maxScore: {
      type: Number,
      min: 1,
      default: 100,
    },
    attachments: {
      type: [AttachmentSchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

AssignmentSchema.index({ course: 1, createdAt: 1 });

module.exports = mongoose.model('Assignment', AssignmentSchema);
