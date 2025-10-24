// server/models/Message.js
const mongoose = require('mongoose');

const MessageAttachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: null },
    filename: { type: String, default: '' },
    type: { type: String, default: 'file' }, // file | image | link
  },
  { _id: false }
);

const MessageSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: false,
      index: true,
    },
    roomId: {
      type: String,
      default: null,
      index: true,
    }, // optional channel/room identifier
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      trim: true,
      required: true,
      maxlength: 5000,
    },
    attachments: {
      type: [MessageAttachmentSchema],
      default: [],
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    seenBy: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ],
  },
  { timestamps: true }
);

MessageSchema.index({ roomId: 1, createdAt: 1 });
MessageSchema.index({ course: 1, createdAt: 1 });

module.exports = mongoose.model('Message', MessageSchema);
